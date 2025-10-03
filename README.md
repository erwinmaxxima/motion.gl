# motion.gl

A JavaScript library for animating the movement of objects on a map, built using `deck.gl` and designed to integrate with `maplibre-gl`. It allows for creating smooth, configurable animations along specified paths or through direct commands.

## Key Features

*   **Path-based Animation**: Animate objects along a series of geographic coordinates (waypoints).
*   **Direct Object Control**: Issue commands to objects to change their speed, heading, or altitude dynamically.
*   **Realistic Motion**: Configure object-specific parameters like maximum speed (`maxSpeed`), acceleration (`accelRate`), climb rate (`climbRate`), and turn rate (`turnRate`).
*   **Path Smoothing**: Automatically generate curved, natural-looking turns between path segments.
*   **Event Handling**: Listen for events like `started`, `paused`, `resumed`, and `ended` to create interactive experiences.
*   **Flexible Animation Control**: Define animations by duration or by speed.
*   **Simulation Speed Control**: Speed up or slow down the entire simulation time.

## Dependencies

*   [maplibre-gl](https://maplibre.org/maplibre-gl-js/docs/): For rendering the base map.
*   [deck.gl](https://deck.gl/): For rendering the motion layers (icons and paths) on top of the map.

## How to Use

Here is a basic example of how to add an animated object to a map.

1.  **Set up your HTML file:**
    Include the necessary CSS and JavaScript files for `maplibre-gl` and `deck.gl`. You also need to include the `motion.js` library files.

    ```html
    <!DOCTYPE html>
    <html>
    <head>
      <title>Motion.gl Simple Example</title>
      <script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
      <link href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet" />
      <script src="https://unpkg.com/deck.gl@9.0.32/dist.min.js"></script>
      <script src="src/motion.js"></script>
      <script src="src/motion.easing.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { position: absolute; top: 0; bottom: 0; width: 100%; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        // Your JavaScript code goes here
      </script>
    </body>
    </html>
    ```

2.  **Initialize the Map and Motion Manager:**
    Create a `maplibre-gl` map instance and a `deck.gl` overlay. Then, initialize the `MotionManager` to handle your animated objects.

    ```javascript
    // Initialize MapLibre
    const map = new maplibregl.Map({
      container: 'map',
      style: 'https://demotiles.maplibre.org/style.json',
      center: [112.8, -7.1],
      zoom: 8
    });

    // Initialize Deck.gl Overlay
    const overlay = new deck.MapboxOverlay({ interleaved: true, layers: [] });
    map.addControl(overlay);

    // Initialize Motion Manager
    const motionManager = new MotionManager(overlay);
    ```

3.  **Create and Animate an Object:**
    Define a path and use `L.motion.polyline` to create a new motion object. You can then control its animation.

    ```javascript
    const samplePath = [
      [-7.10, 112.80],
      [-7.05, 112.90],
      [-7.00, 113.05],
      [-6.95, 113.15]
    ];

    const motionObject = L.motion.polyline(samplePath, {
        duration: 5000, // Animate over 5 seconds
        color: '#0000ff'
    }, motionManager);

    // Start the animation
    motionObject.motionStart();
    ```

## Future Development Suggestions

*   **Advanced Pathfinding**: Integrate with routing engines to generate paths based on real-world road networks.
*   **Physics-based Enhancements**: Add more physics-based parameters like wind resistance or momentum for more realistic simulations.
*   **Improved 3D Support**: Enhance altitude transitions and camera controls for better 3D visualization.
*   **GUI for Controls**: Develop a simple UI component for controlling animation playback and object properties.
*   **TypeScript Conversion**: Migrate the codebase to TypeScript for improved type safety and developer experience.