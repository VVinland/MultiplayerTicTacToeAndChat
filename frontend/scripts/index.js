const currentTurn = document.getElementById('currentTurn');
const winner = document.getElementById('winnerId');
const resultMatch = document.getElementById('result');
const content = document.getElementById('content');
const crossPlayer = document.getElementById('crossPlayer');
const nameCrossPlayer = crossPlayer.elements.nameCrossPlayer;
const controlTime = crossPlayer.elements.controlTime;

const circlePlayer = document.getElementById('circlePlayer');
const nameCirclePlayer = circlePlayer.elements.nameCirclePlayer;

const playerOne = document.getElementById('playerOne');
const playerTwo = document.getElementById('playerTwo');
const time = document.getElementById('time');
const formChat = document.getElementById('formChat');
const chat = formChat.elements.chat;
const messages = document.getElementById('messages');
const numberOfMovesMade = document.getElementById('numberOfMovesMade');

const socket = io();

const token = {
    1: 'cross',
    2: 'circle'
} // SVG
let timeMinut; // чтобы таймер работал
let clientId; // 1 или 2
let activeId; // 1 или 2
const arrayMessages = []; //запихивал туда сообщения, а затем массив в localStorage
const arrayName = []; //запихивал туда имена, а затем массив в localStorage

socket.on('clientId', function (idPlayer) {
    clientId = idPlayer;
})

socket.on('start', function (startId) {
    activeId = startId;
    if (clientId == activeId) {
        content.style.display = 'none'
        crossPlayer.style.display = 'flex';
    } else {
        content.style.display = 'none'
        circlePlayer.style.display = 'flex';
    }
})// при появление двух игрков открываются соот-щие формы

crossPlayer.addEventListener('submit', function (event) {
    event.preventDefault();

    if (nameCrossPlayer.value && controlTime.value) {
        socket.emit('paramsPlayer', {
            'name': nameCrossPlayer.value,
            'time': controlTime.value
        })
        crossPlayer.style.display = 'none';
        content.style.display = 'flex'
    }
})//данные передаваемые из формы на сервер. Тут два объекта а у нолика один объект
// переменная "timerGame" с сервера нужна чтобы настроить таймер

circlePlayer.addEventListener('submit', function (event) {
    event.preventDefault();

    if (nameCirclePlayer.value) {
        socket.emit('paramsPlayer', {
            'name': nameCirclePlayer.value
        })
        circlePlayer.style.display = 'none';
        content.style.display = 'flex'
    }
})//данные передаваемые из формы на сервер

socket.on('installName', function (params) {
    console.log(params.name)
    arrayName.push(params);
    localStorage.setItem('playersWindow', JSON.stringify(arrayName));

    setName(params);

    currentTurn.classList.remove('hide');
    currentTurn.innerHTML = clientId == activeId ?
        `Ходит ${token[activeId]}` :
        `Ходит ${token[activeId]}`;
})//установка имени

socket.on('installTime', function (time) {
    timeMinut = parseInt(time.time) * 60000
    const array = JSON.parse(localStorage.getItem('playersWindow'));
    if (array.length == 2) {
        timer(timeMinut);
    }
})//установка таймера

formChat.addEventListener('submit', function (event) {
    event.preventDefault();

    if (chat.value && clientId == 1) {
        socket.emit('createMessage', {
            name: nameCrossPlayer.value,
            text: chat.value
        })
        chat.value = '';
    }


    if (chat.value && clientId == 2) {
        socket.emit('createMessage', {
            name: nameCirclePlayer.value,
            text: chat.value
        })
        chat.value = '';
    }
})//Отправка будущего сообщения на сервер

socket.on('newMessage', function (message) {
    if (!message.name) {
        const arrayOfTwoNames = JSON.parse(localStorage.getItem('playersWindow'));
        if (arrayOfTwoNames) {
            for (let i = 0; i < arrayOfTwoNames.length; i++) {
                let name = arrayOfTwoNames[0 + i];
                if (name.id == message.id) {
                    message.name = name.name; // этот цикл нужен чтобы при перезагрузке страницы
                    // у сообщения было имя отправителя
                }
            }
        }
    }
    arrayMessages.push(message);
    localStorage.setItem('messages', JSON.stringify(arrayMessages));
    setMessage(message.id, message.name, message.text, message.creadedAt);
})


socket.on('reload', function (active, field) {
    activeId = active;
    for (let x = 0; x < field.length; x++) {
        for (let y = 0; y < field.length; y++) {
            setField(x, y, field[x][y]);
        }
    }//кнопки 

    for (let x = 0; x < field.length; x++) {
        for (let y = 0; y < field.length; y++) {
            if (getField(x, y).classList.contains(token[1])) {
                setMoveMade(1);
            }

            if (getField(x, y).classList.contains(token[2])) {
                setMoveMade(2);
            }//количество сделанных ходов

        }
    }
    const arrayMes = JSON.parse(localStorage.getItem('messages'));
    if (arrayMes) {
        for (let i = 0; i < arrayMes.length; i++) {
            let mess = arrayMes[0 + i];
            setMessage(mess.id, mess.name, mess.text, mess.createdAt);
        }//сообщения
    }

    const arrayOfTwoNames = JSON.parse(localStorage.getItem('playersWindow'));
    if (arrayOfTwoNames) {
        for (let i = 0; i < arrayOfTwoNames.length; i++) {
            let name = arrayOfTwoNames[0 + i];
            console.log(name);
            setName(name);
        }//чтобы имена игроков отображались в окне игроков.
    }

    let numberTime = parseInt(localStorage.getItem('time'));
    if (numberTime) {
        timer(numberTime);
    }//Чтобы таймер работал после перезагрузки

    currentTurn.innerHTML = `Ходит ${token[activeId]}`
    //Это штука будет и дальше
    // нужна для отображения чей сейчас ход
})


socket.on('turn', function (turn) {
    setField(turn.x, turn.y, activeId); //записывает ход на стороне клиента
    setMoveMade(activeId)// и записывает кол-во сделанных ходов

    activeId = turn.next;

    currentTurn.innerHTML = `Ходит ${token[activeId]}`

})

socket.on('result', function (result) { //результат
    const winnerId = result['id'];
    if (winnerId != 0) {
        winner.innerHTML = winnerId == clientId ? `Вы победили!` : `Вы проиграли.`
    } else {
        winner.innerHTML = 'Draw!'
    }

    localStorage.clear();
    socket.disconnect();


    resultMatch.classList.remove('hide');
    content.style.display = 'none';
    currentTurn.classList.add('hide');
})


function getField(x, y) {
    return document.getElementById(`x${x}y${y}`); //получения id кнопки
}

function setField(x, y, id) {
    const cell = document.getElementById(`x${x}y${y}`);
    cell.classList.add(token[id]);
}//установка класса в определённую кнопку

function setMoveMade(moveMade) {
    const move = document.createElement('li');
    move.classList.add(token[moveMade]);
    numberOfMovesMade.appendChild(move);
}//установка сделанных ходов.

function turn(x, y) { // срабатывает при нажатии на кнопку
    if (clientId != activeId) return;
    if (getField(x, y).classList.contains(token[1]) ||
        getField(x, y).classList.contains(token[2])) return;
    socket.emit('turn', {
        'x': x,
        'y': y
    })
}

function restartGame() {
    window.location.reload();
}

function timer(timeMinut) {// с таймером баг
    {                       //когда игра закончилась он все равно остаётся
        setInterval(function () { // При запуске новой игры, у второго игрока будет время с прошлой игры
            localStorage.setItem('time', timeMinut);// Если перезагрузить страницу, то время станет как должно быть
            const min = Math.floor(timeMinut / 1000 / 60) % 60;// правда присутствует расхождение
            const sec = Math.floor(timeMinut / 1000) % 60;// во времени, примерно в секунду между таймерами игроков
            if (timeMinut <= 0) {
                clearInterval(timer);
                alert('Время вышло.');
            } else {
                const minLeft = min < 10 ? '0' + min : min;
                const secLeft = sec < 10 ? '0' + sec : sec;
                let strTimer = `${minLeft}:${secLeft}`;
                time.innerHTML = strTimer;
            }
            timeMinut -= 1000;
        }, 1000)
    }
}

function setMessage(id, name, text, createdAt) {
    moment.locale('ru'); // добавил библиотеку moment, чтобы было проще управлять временем
    const formattedTime = moment(createdAt).format('LT');
    if (id == clientId) {
        messages.insertAdjacentHTML(
            'afterbegin',
            `<li class = myMessage> 
            <div>
                <label>${name}</label>
                <span>${formattedTime}</span></div>
            <div>
                <p>${text}</p>
            </div>
        </li>`
        )
        setTimeout(function () {
            messages.scrollTop = messages.scrollHeight;
        }, 0)
    } else {
        messages.insertAdjacentHTML(
            'afterbegin',
            `<li class = notYourMessage> 
            <div>
                <label>${name}</label>
                <span>${formattedTime}</span>
            </div>
            <div>
                 <p>${text}</p>
            </div>
        </li>`
        )
    }
}

function setName(params) {

    if (Object.keys(params).length == 3) {
        playerOne.innerHTML = 'X ' + params.name;
    }

    if (Object.keys(params).length == 2) {
        playerTwo.innerHTML = 'O ' + params.name;
    }
}