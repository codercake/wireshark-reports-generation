function handleWebSocketMessage(ws, data) {
    switch(data.type) {
        case 'START_CAPTURE':
            // Handle capture start
            break;
        case 'STOP_CAPTURE':
            // Handle capture stop
            break;
        default:
            ws.send(JSON.stringify({ error: 'Unknown message type' }));
    }
}

function stopCaptureForClient(ws) {
    const captureProcess = activeCaptures.get(ws);
    if (captureProcess) {
        captureProcess.kill();
        activeCaptures.delete(ws);
    }
}

module.exports = { handleWebSocketMessage, stopCaptureForClient };
