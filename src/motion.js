/* ---------------------------
   Utility: geodesy (meters)
   --------------------------- */
function toRad(d){ return d * Math.PI / 180; }
function toDeg(r){ return r * 180 / Math.PI; }

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [255, 0, 0]; // default to red on parse error
}

// Haversine distance (meters)
function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // m
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)*Math.sin(dLat/2) +
            Math.cos(toRad(lat1))*Math.cos(toRad(lat2)) *
            Math.sin(dLon/2)*Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Interpolate along great-circle (approx linear in lat/lon for small segments)
function interpolateLatLon(lat1, lon1, lat2, lon2, t) {
  // simple linear interpolation good for small steps (short segments)
  return [ lat1 + (lat2 - lat1) * t, lon1 + (lon2 - lon1) * t ];
}

/* ---------------------------
   Motion Engine
   --------------------------- */

class MotionObject {
  constructor(id, pathCoords, options = {}, isClosedPath = false) {
    this.id = id;
    let coords = pathCoords.slice();

    this.options = Object.assign({
      auto: false,
      speed: 0, // km/h
      duration: 0, // ms
      easing: L.Motion.Ease.linear,
      color: '#ff0000',
      width: 5,
      turn: null // 'tight', 'normal', 'loose'
    }, options);

    if (this.options.turn && L.Motion.PathUtil) {
        const turnRadii = { tight: 0.05, normal: 0.1, loose: 0.2 };
        const radius = turnRadii[this.options.turn] || turnRadii.normal;
        // The path smoothing works on [lon, lat] for easier vector math, so we convert.
        let lonLatPath = coords.map(p => [p[1], p[0]]);
        let smoothedLonLatPath = L.Motion.PathUtil.generateCurvedPath(lonLatPath, radius);
        coords = smoothedLonLatPath.map(p => [p[1], p[0]]);
    }

    if (isClosedPath && coords.length > 0) {
        if (Array.isArray(coords[0][0])) {
            coords = coords[0];
        }
        const first = coords[0];
        const last = coords[coords.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
            coords.push(first);
        }
    }

    this.path = coords.map(p => ({ lat: p[0], lon: p[1] }));

    this._events = new Map();
    this.segments = [];
    this.totalDistance = 0;
    for (let i = 0; i < this.path.length - 1; i++) {
      const a = this.path[i], b = this.path[i+1];
      const d = haversineMeters(a.lat, a.lon, b.lat, b.lon);
      this.segments.push({ d, lat1: a.lat, lon1: a.lon, lat2: b.lat, lon2: b.lon });
      this.totalDistance += d;
    }

    this.offsetMeters = 0;
    this.paused = !this.options.auto;
    this.loop = false;
    this.visible = true;

    if (this.options.auto) {
      this.motionStart();
    }
  }

  motionSpeed(speed) {
    this.options.speed = speed;
    this.options.duration = 0; // speed takes precedence
    return this;
  }

  motionDuration(duration) {
    this.options.duration = duration;
    this.options.speed = 0; // duration takes precedence
    return this;
  }

  motionPause() { this.paused = true; this.fire('paused'); return this; }
  motionResume() { this.paused = false; this.fire('resumed'); return this; }
  motionStart() {
    this.offsetMeters = 0;
    this.paused = false;
    this.fire('started');
    return this;
  }
  motionEnd() {
    this.offsetMeters = this.totalDistance;
    this.paused = true;
    this.fire('ended');
    return this;
  }

  on(event, cb) {
    if (!this._events.has(event)) this._events.set(event, []);
    this._events.get(event).push(cb);
    return this;
  }

  fire(event, data) {
      if (this._events.has(event)) {
          this._events.get(event).forEach(cb => cb({ layer: this, ...data }));
      }
  }

  setLoop(flag) { this.loop = !!flag; return this; }

  step(dt) {
    if (this.paused || this.totalDistance <= 0) return;

    let speed_mps;
    if (this.options.duration > 0) {
        speed_mps = this.totalDistance / (this.options.duration / 1000);
    } else if (this.options.speed > 0) {
        // km/h to m/s
        speed_mps = this.options.speed * 1000 / 3600;
    } else {
        return; // no motion
    }

    this.offsetMeters += speed_mps * dt;

    if (this.offsetMeters >= this.totalDistance) {
      if (this.loop) {
        this.offsetMeters %= this.totalDistance;
        this.fire('ended'); // fire end event on each loop completion
      } else {
        this.offsetMeters = this.totalDistance;
        this.paused = true;
        this.fire('ended');
      }
    }
  }

  currentPosition() {
    if (this.path.length === 1) return { lat: this.path[0].lat, lon: this.path[0].lon, heading: 0 };

    let progress = this.totalDistance > 0 ? this.offsetMeters / this.totalDistance : 0;
    progress = this.options.easing(Math.min(1, Math.max(0, progress)));
    const easedOffset = progress * this.totalDistance;

    if (easedOffset <= 0) {
      const s = this.segments[0];
      return { lat: s.lat1, lon: s.lon1, heading: this._headingBetween(s.lat1, s.lon1, s.lat2, s.lon2) };
    }

    let remaining = easedOffset;
    for (const seg of this.segments) {
      if (remaining <= seg.d) {
        const t = seg.d === 0 ? 0 : (remaining / seg.d);
        const [lat, lon] = interpolateLatLon(seg.lat1, seg.lon1, seg.lat2, seg.lon2, t);
        const heading = this._headingBetween(seg.lat1, seg.lon1, seg.lat2, seg.lon2);
        return { lat, lon, heading };
      }
      remaining -= seg.d;
    }

    const last = this.path[this.path.length-1];
    const prev = this.path[this.path.length-2];
    return { lat: last.lat, lon: last.lon, heading: this._headingBetween(prev.lat, prev.lon, last.lat, last.lon) };
  }

  getTraveledPath() {
    const traveledPath = [];

    let progress = this.totalDistance > 0 ? this.offsetMeters / this.totalDistance : 0;
    progress = this.options.easing(Math.min(1, Math.max(0, progress)));
    let remaining = progress * this.totalDistance;

    if (remaining <= 0 && this.path.length > 0) {
        const firstPoint = this.path[0];
        return [[firstPoint.lon, firstPoint.lat]];
    }

    for (const seg of this.segments) {
      if (traveledPath.length === 0) {
        traveledPath.push([seg.lon1, seg.lat1]);
      }

      if (remaining < seg.d) {
        const t = seg.d === 0 ? 0 : (remaining / seg.d);
        const [lat, lon] = interpolateLatLon(seg.lat1, seg.lon1, seg.lat2, seg.lon2, t);
        traveledPath.push([lon, lat]);
        break;
      }

      traveledPath.push([seg.lon2, seg.lat2]);
      remaining -= seg.d;

      if (remaining <= 0) {
          break;
      }
    }
    return traveledPath;
  }

  _headingBetween(lat1, lon1, lat2, lon2) {
    const dLon = toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRad(lat2));
    const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
              Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
    let brng = Math.atan2(y, x);
    brng = (toDeg(brng) + 360) % 360;
    return brng;
  }
}

class MotionManager {
  constructor(overlay, options = {}) {
    this.overlay = overlay;
    this.options = Object.assign({
        iconAtlas: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png',
        iconMapping: { plane: { x: 0, y: 0, width: 128, height: 128, mask: true, anchorY: 64 } },
        getIcon: d => 'plane',
        getSize: d => 48,
        pathWidth: 5,
        pathColor: [255, 0, 0, 255]
    }, options);
    this.objects = new Map();
    this._lastTs = null;
    this._running = false;
    this._startLoop();
  }

  add(id, pathCoords, options, isClosedPath) {
    const obj = new MotionObject(id, pathCoords, options, isClosedPath);
    this.objects.set(id, obj);
    return obj;
  }

  remove(id) { this.objects.delete(id); }
  get(id) { return this.objects.get(id); }

  _startLoop() {
    this._running = true;
    const loop = (ts) => {
      if (!this._running) return;
      if (!this._lastTs) this._lastTs = ts;
      const dt = (ts - this._lastTs) / 1000.0;
      this._lastTs = ts;

      for (const obj of this.objects.values()) obj.step(dt);

      this.render();

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  render() {
      const iconData = [];
      const pathData = [];

      for (const [id, obj] of this.objects.entries()) {
        if (!obj.visible) continue;
        const p = obj.currentPosition();
        iconData.push({
          id,
          position: [p.lon, p.lat],
          heading: p.heading,
          object: obj
        });

        pathData.push({
            path: obj.getTraveledPath(),
            color: hexToRgb(obj.options.color),
            width: obj.options.width
        })
      }

      const iconLayer = new deck.IconLayer({
        id: 'motion-icons',
        data: iconData,
        pickable: true,
        iconAtlas: this.options.iconAtlas,
        iconMapping: this.options.iconMapping,
        getIcon: this.options.getIcon,
        getPosition: d => d.position,
        getSize: this.options.getSize,
        sizeScale: 1,
        getAngle: d => d.heading || 0,
      });

      const pathLayer = new deck.PathLayer({
        id: 'motion-paths',
        data: pathData,
        getPath: d => d.path,
        getColor: d => d.color,
        getWidth: d => d.width,
        widthMinPixels: 2
      });

      const existingLayers = (this.overlay.props && this.overlay.props.layers) ? this.overlay.props.layers : [];
      const withoutPrev = existingLayers.filter(l => l.id !== 'motion-icons' && l.id !== 'motion-paths');
      this.overlay.setProps({ layers: [...withoutPrev, pathLayer, iconLayer] });
  }

  stop() {
      this._running = false;
  }
}

class MotionGroup {
    constructor(layers) {
        this.layers = layers;
    }

    motionStart() { this.layers.forEach(l => l.motionStart()); return this; }
    motionPause() { this.layers.forEach(l => l.motionPause()); return this; }
    motionResume() { this.layers.forEach(l => l.motionResume()); return this; }
    motionEnd() { this.layers.forEach(l => l.motionEnd()); return this; }
    motionToggle() { this.layers.forEach(l => l.motionToggle()); return this; }
    setLoop(flag) { this.layers.forEach(l => l.setLoop(flag)); return this; }
}

class MotionSequence {
    constructor(layers) {
        this.layers = [];
        this.currentIndex = -1;
        this._state = 'stopped'; // "stopped" | "running"
        this._events = new Map();

        layers.forEach(layer => this.addLayer(layer, false));
    }

    _bindLayer(layer, index) {
        layer.on('ended', () => {
            this.fire('section', { layer: layer, index: index });
            if (this.currentIndex === this.layers.length - 1) {
                this._state = 'stopped';
                this.fire('ended');
            } else {
                this._next();
            }
        });
    }

    motionStart() {
        if (this._state === 'stopped' && this.layers.length > 0) {
            this.currentIndex = 0;
            this._state = 'running';
            this.layers[this.currentIndex].motionStart();
            this.fire('started');
        }
        return this;
    }

    _next() {
        if (this._state !== 'running') return;

        if (this.currentIndex < this.layers.length - 1) {
            this.currentIndex++;
            this.layers[this.currentIndex].motionStart();
        } else {
            this._state = 'stopped';
        }
    }

    addLayer(layer, autostart) {
        const newIndex = this.layers.length;
        this.layers.push(layer);
        this._bindLayer(layer, newIndex);

        if (autostart) {
            const wasFinished = this._state === 'stopped' && this.currentIndex === newIndex - 1;
            if (wasFinished) {
                this._state = 'running';
                this._next();
            }
        }
    }

    on(event, cb) {
        if (!this._events.has(event)) this._events.set(event, []);
        this._events.get(event).push(cb);
        return this;
    }

    fire(event, data) {
        if (this._events.has(event)) {
            this._events.get(event).forEach(cb => cb({ layer: this, ...data }));
        }
    }
}

/* ---------------------------
   L.motion API Adaptor
   --------------------------- */
var L;
(function (L) {
    L.Motion = L.Motion || {};
    L.Motion.Event = {
        Started: "motion-started",
        Paused: "motion-paused",
        Resumed: "motion-resumed",
        Ended: "motion-ended",
        Section: "motion-section"
    };

    let _objIdCounter = 1;

    const createMotion = (coords, options, manager, isClosedPath) => {
        const id = 'm' + (_objIdCounter++);
        const obj = manager.add(id, coords, options, isClosedPath);

        const wrapper = {
            id,
            motionSpeed: (s) => { obj.motionSpeed(s); return wrapper; },
            motionDuration: (d) => { obj.motionDuration(d); return wrapper; },
            motionPause: () => { obj.motionPause(); return wrapper; },
            motionResume: () => { obj.motionResume(); return wrapper; },
            motionStart: () => { obj.motionStart(); return wrapper; },
            motionEnd: () => { obj.motionEnd(); return wrapper; },
            motionToggle: () => {
                if (obj.paused) {
                    obj.motionResume();
                } else {
                    obj.motionPause();
                }
                return wrapper;
            },
            on: (evt, cb) => { obj.on(evt, cb); return wrapper; },
            setLoop: (f) => { obj.setLoop(f); return wrapper; },
            setVisible: (v) => { obj.visible = !!v; return wrapper; },
            getMarker: () => ({ getObject: () => obj }),
            getMarkers: () => ([wrapper.getMarker()]),
            _obj: obj
        };
        return wrapper;
    };

    L.motion = {
        polyline: function(coords, options = {}, manager) {
            return createMotion(coords, options, manager, false);
        },
        path: function(coords, options = {}, manager) {
            return createMotion(coords, options, manager, true);
        },
        group: function(layers) {
            return new MotionGroup(layers);
        },
        seq: function(layers) {
            return new MotionSequence(layers);
        }
    };

})(L || (L = {}));
