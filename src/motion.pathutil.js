/*
 * Path smoothing and geometry utility functions.
 */
var L;
(function (L) {
    L.Motion = L.Motion || {};
    L.Motion.PathUtil = {
        // Vector utility functions
        vec: {
            sub: (v1, v2) => [v1[0] - v2[0], v1[1] - v2[1]],
            add: (v1, v2) => [v1[0] + v2[0], v1[1] + v2[1]],
            scale: (v, s) => [v[0] * s, v[1] * s],
            mag: (v) => Math.sqrt(v[0] * v[0] + v[1] * v[1]),
            normalize: function(v) {
                const mag = this.mag(v);
                return mag > 0 ? [v[0] / mag, v[1] / mag] : [0, 0];
            },
            dot: (v1, v2) => v1[0] * v2[0] + v1[1] * v2[1]
        },

        /**
         * Generates a new path with smoothed corners.
         * @param {Array<[number, number]>} path - The original path, an array of [lat, lon] points.
         * @param {number} radius - The radius of the turn.
         * @param {number} pointsPerTurn - How many points to generate for each curve.
         * @returns {Array<[number, number]>} A new path with smoothed corners.
         */
        generateCurvedPath: function(path, radius, pointsPerTurn = 10) {
            if (path.length < 3) {
                return path; // Not enough points to form a corner
            }

            const newPath = [path[0]];
            const vec = this.vec;

            for (let i = 1; i < path.length - 1; i++) {
                const p0 = path[i - 1];
                const p1 = path[i];
                const p2 = path[i + 1];

                const v1 = vec.normalize(vec.sub(p0, p1));
                const v2 = vec.normalize(vec.sub(p2, p1));

                // Angle between the two segments
                const angle = Math.acos(vec.dot(v1, v2));

                // If the angle is too small, don't curve
                if (angle < 0.1 || Math.abs(angle - Math.PI) < 0.1) {
                    newPath.push(p1);
                    continue;
                }

                // Calculate the distance from the corner to the tangent points
                const tan = radius / Math.tan(angle / 2);

                const distToP0 = vec.mag(vec.sub(p0, p1));
                const distToP2 = vec.mag(vec.sub(p2, p1));

                // Clamp the tangent distance to be at most half the length of the shorter segment
                const maxTan = Math.min(distToP0, distToP2) / 2;
                const effectiveTan = Math.min(tan, maxTan);

                // Calculate tangent points
                const t1 = vec.add(p1, vec.scale(v1, effectiveTan));
                const t2 = vec.add(p1, vec.scale(v2, effectiveTan));

                // Calculate the control point for a quadratic Bezier curve
                // For a simple arc-like curve, the corner point itself is a good control point
                const controlPoint = p1;

                newPath.push(t1);

                // Generate points for the curve (quadratic Bezier)
                for (let j = 1; j <= pointsPerTurn; j++) {
                    const t = j / (pointsPerTurn + 1);
                    const t_ = 1 - t;
                    const pointOnCurve = vec.add(
                        vec.add(
                            vec.scale(t1, t_ * t_),
                            vec.scale(controlPoint, 2 * t_ * t)
                        ),
                        vec.scale(t2, t * t)
                    );
                    newPath.push(pointOnCurve);
                }
                newPath.push(t2);
            }

            newPath.push(path[path.length - 1]);

            // De-duplicate points
            const finalPath = [];
            for (let i = 0; i < newPath.length; i++) {
                if (i === 0 || vec.mag(vec.sub(newPath[i], newPath[i-1])) > 1e-6) {
                    finalPath.push(newPath[i]);
                }
            }

            return finalPath;
        }
    };
})(L || (L = {}));
