import { WebSocketServer, WebSocket } from 'ws';

const matchSubscribers = new Map();

function subscribeToMatch(matchId, socket) {
    if(!matchSubscribers.has(matchId)) {
        matchSubscribers.set(matchId, new Set());
    }

    matchSubscribers.get(matchId).add(socket);
}

function unsubscribeFromMatch(matchId, socket) {
   const subscribers = matchSubscribers.get(matchId);
   if(!subscribers) return;

   subscribers.delete(socket);

   if(subscribers.size === 0) {
    matchSubscribers.delete(matchId);
   }
}

function cleanupSubscriptions() {
    for(const matchId of socket.subscriptions) {
        unsubscribeFromMatch(matchId, socket);
    }
}

function sendJson(socket, payload) {
    if(socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify(payload));

}

function broadcastToAll(wss, payload) {
    for(const client of wss.clients) {
        if(client.readyState !== WebSocket.OPEN) continue;
        client.send(JSON.stringify(payload));
    }
}

function broadCastToMatch(matchId, payload) {
    const subscribers = matchSubscribers.get(matchId);
    if(!subscribers || subscribers.size === 0) return;

    const message = JSON.stringify(payload);
    subscribers.forEach((client) => {
        if(client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

function handleMessage(socket, data) {
    let message;
    try {
        message = JSON.parse(data.toString());
    } catch (error) {
        sendJson(socket, { type: 'error', message: 'Invalid JSON payload'});
    }

    if(message?.type === 'subscribe' && Number.isInteger(message.matchId)) {
        subscribeToMatch(message.matchId, socket);
        socket.subscriptions.add(message.matchId);
        sendJson(socket, { type: 'subscribed', matchId: message.matchId});
        return;
    }

    if(message?.type === 'unsubscribe' && Number.isInteger(message.matchId)) {
        unsubscribeFromMatch(message.matchId, socket);
        socket.subscriptions.delete(message.matchId);
        sendJson(socket, { type: 'unsubscribed', matchId: message.matchId});
        return;
    }
}

export function attachWebSocketServer(server) {
    const wss = new WebSocketServer({ 
        server,
        path: '/ws',
        maxPayload: 1024 * 1024,
     });

     wss.on('connection', (socket) => {
        socket.subscriptions = new Set();
        sendJson(socket,{ type: 'welcome'});

        socket.on('message', (data) => handleMessage(socket, data));
        socket.on('error', () => socket.terminate());
        socket.on('close', () => cleanupSubscriptions(socket));
     })

     function broadcastMatchCreated(match) {
        broadcastToAll(wss, { type: 'match_created', data: match});
     }

     function broadcastCommentary(matchId, comment) {
        broadCastToMatch(matchId, { type: 'commentary', data: comment});
     }

     return { broadcastMatchCreated, broadcastCommentary };
}
