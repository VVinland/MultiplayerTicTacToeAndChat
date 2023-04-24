import path from 'path';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { Field } from './components/field.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 1337;
const __dirname = path.resolve();


const field = new Field();
const players = {
    1: '',
    2: ''
}
let activePlayer = 1;  //1-крестик; 2-нолик
let started = false; // если true то игра началась и есть возможность перезагружать страницу, без потери контента
let gameOver = false; //проверка на конец игры
let timerGame; // чтобы таймер работал. 

app.use('/frontend', express.static(path.resolve(__dirname, 'frontend')));
app.set('view engine', 'ejs');

io.on('connection', (socket) => {

    if (io.sockets.sockets.size > 2) {
        console.log('Not place. Await')
        socket.disconnect(); // Только для клиента могут находится на страничке и что-то делать
    }

    const socketIdPlayer = socket.id;
    joinPlayers(socketIdPlayer);

    const idPlayer = getKeyByValue(players, socketIdPlayer) //1-крестик; 2-нолик
    socket.emit('clientId', idPlayer);

    if (io.sockets.sockets.size === 2 && !started) {
        started = true;
        io.emit('start', activePlayer);
    }

    socket.on('paramsPlayer', data => { //Установка имен игроков и времени
        const idName = getKeyByValue(players, socket.id);
        if (data.time) {
            timerGame = data.time;
        }
        io.emit('installName', {
            name: data.name,
            time: data.time,
            id:idName
        })
        io.emit('installTime', {
            time: timerGame,
            id:idName
        });
    })

    socket.on('createMessage', (data) => {
        const idName = getKeyByValue(players, socket.id);
        console.log(data.name);
        io.emit('newMessage', {
            name: data.name,
            text: data.text,
            id: idName,
            createdAt: new Date().getTime()
        });
    })

    if (started) {
        socket.emit('reload', activePlayer, field.getField()); //reload чтобы при перезагрузке все оставлось на своих местах
    }

    socket.on('turn', (turn) => { // обработчик события отвечающий за сделанный ход
        console.log(`Turn by ${idPlayer}: ${turn.x}, ${turn.y}`);
        if (gameOver) return;

        activePlayer = 3 - activePlayer;

        field.setCell(turn.x, turn.y, idPlayer);

        io.emit('turn', {
            'x': turn.x,
            'y': turn.y,
            'next': activePlayer
        });

        const result = field.checkGameOver(idPlayer);
        gameOver = result['result'];
        if (gameOver) {
            console.log(result['id'] != 0 ? `Game over! The winner is player ${idPlayer}` : `Game over! Draw`)
            io.emit('result', result);

            field.resetField();
            started = false;
            gameOver = false;
            activePlayer = 1;
        }
    })

    socket.on('disconnect', () => {
        const player = getKeyByValue(players, socket.id);
        players[player] = '';
    })
})

app.get('/', (req, res) => {
    res.render('index');
})

server.listen(PORT);

function joinPlayers(idClient) {
    for (const player in players) {
        const currentPlayer = players[player];
        if (currentPlayer == '') {
            players[player] = idClient;
            return;
        }
    }
}

function getKeyByValue(obj, value) {
    return Object.keys(obj).find(key => obj[key] === value);
}