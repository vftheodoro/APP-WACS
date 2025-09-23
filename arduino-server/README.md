# Arduino Serial Server

This Node.js server auto-detects a serial port (Arduino/USB) and forwards messages between:

- stdin (terminal) -> Arduino serial
- WebSocket clients -> Arduino serial
- Arduino serial -> all connected WebSocket clients and stdout

Usage

1. Install dependencies:

```powershell
cd arduino-server
npm install
```

2. Run the server:

```powershell
npm start
```

3. From the Android emulator running Expo Go, connect to the host machine using `10.0.2.2` and port `3001` (WebSocket):

- Example WebSocket URL: `ws://10.0.2.2:3001`

Notes

- The server tries to auto-detect serial ports using heuristics. If it fails, plug the Arduino and restart the server or wait—it will retry every 5s.
- The server writes terminal lines (stdin) followed by a newline to the serial port.
- Use a baud rate of 9600. Change `server.js` if your Arduino uses a different baud rate.

Security

- This server listens on all interfaces by default for WebSocket. Run on a trusted network or add firewall rules if needed.
