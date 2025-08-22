# motion.gl
animasi pergerakan object diatas peta menggunakan libregljs dan deckgl

## Perintah gerak
Setiap objek memiliki variabel independen seperti `maxSpeed`, `accelRate`, `climbRate`, dan `turnRate`.
Objek dapat digerakkan melalui waypoint ataupun perintah langsung:

- `speedTo(kmh)` mengubah kecepatan secara bertahap.
- `headingTo(derajat)` memutar objek sesuai `turnRate`.
- `climbTo(meter)` mengubah ketinggian mengikuti `climbRate`.
- `setSimSpeed(faktor)` mengatur percepatan simulasi; perintah langsung hanya diproses saat faktor = 1.

Waypoint kini dapat menyertakan nilai ketinggian (lat, lon, alt[, accel]).
