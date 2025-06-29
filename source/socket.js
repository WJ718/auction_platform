const SocketIO = require('socket.io');

module.exports = (server, app) => {
    const io = SocketIO(server, {path: '/socket.io'}); // http 서버에 웹 소켓 서버를 붙이고 경로설정
    app.set('io', io);
    io.on('connection', (socket) => {
        const req = socket.request;
        // 연결 요청의 referer 헤더에서 현재 페이지 경로 가져옴
        const {headers : {referer}} = req;
        const roomId = new URL(referer).pathname.split('/').at(-1);
        // 소켓을 해당 상품 ID 기반의 방에 참여시킴
        socket.join(roomId);
        
        // 사용자가 새로고침, 페이지 이전 등 하면 자동으로 실행
        socket.on('disconnect', () => {
            socket.leave(roomId);
        });
    });
};