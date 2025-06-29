const SSE = require('sse');

module.exports = (server) => {
    const sse = new SSE(server); // 서버에 SSE기능 붙임
    sse.on('connection', (client) => {
        setInterval(() => {
            client.send(Date.now().toString()); // 클라이언트에게 1초마다 현재 시간을 보냄
        }, 1000);
    });
};