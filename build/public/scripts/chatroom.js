//import $ from 'jquery';
//nothin cause it'll assume that its all on the same server alse put io(url)
var socket = io();
;
var Messenger = /** @class */ (function () {
    function Messenger() {
        var _this = this;
        this.lastDate = '';
        this.sideColorArray = ['#56b273', '#b388dd', '#ff8750', '#01AD9B'];
        this.sideColorMap = new Map();
        this.messages = document.querySelector('#chatroom-messages');
        this.form = document.querySelector('#chatroom-form');
        this.msgInput = document.querySelector('#chatroom-msg');
        this.connectionStatus = document.querySelector('#chatroom-connection-status');
        this.setMessageData = function () {
            _this.messageData = {
                msg: _this.msgInput.value,
                sender: _this.getCurrentUser().username,
                receiver: window.location.pathname.substr(10)
            };
        };
        this.setSideColorMap = function () {
            _this.sideColorMap.set(_this.messageData.sender, _this.sideColorArray.splice(Math.floor(Math.random() * _this.sideColorArray.length), 1)[0]);
            _this.sideColorMap.set(_this.messageData.receiver, _this.sideColorArray.splice(Math.floor(Math.random() * _this.sideColorArray.length), 1)[0]);
        };
        this.resetDOMs = function (propsToReset) {
            switch (propsToReset) {
                case "messages" /* messages */:
                    _this["messages" /* messages */] = document.querySelector('#chatroom-messages');
                    break;
                case "form" /* form */:
                    _this["form" /* form */] = document.querySelector('#chatroom-messages');
                    break;
                case "msgInput" /* msgInput */:
                    _this["msgInput" /* msgInput */] = document.querySelector('#chatroom-messages');
                    break;
                case "connectionStatus" /* connectionStatus */:
                    _this["connectionStatus" /* connectionStatus */] = document.querySelector('#chatroom-messages');
                    break;
                default:
                    break;
            }
            _this.form = document.querySelector('#chatroom-form');
            _this.msgInput = document.querySelector('#chatroom-msg');
            _this.connectionStatus = document.querySelector('#chatroom-connection-status');
        };
        this.init = function () {
            if (!_this.userAvailable()) {
                _this.getIndexPage();
            }
            //initialize sockets
            _this.socketOnStatus();
            _this.socketOnOnline();
            _this.socketOnMsgSend();
            _this.socketOnMsgDelete();
            _this.messages.innerHTML = 'Loading.....';
            _this.getUserStatus();
            _this.setSideColorMap();
            _this.getSenderReceiverMessage();
            _this.onSendMessage();
        };
        //sockets
        this.socketOnOnline = function () {
            socket.on('online', function (onlineInfo) {
                _this.setMessageData();
                if (onlineInfo.username === _this.messageData.receiver) {
                    _this.setStatus(onlineInfo.username, onlineInfo.online);
                }
            });
        };
        this.socketOnStatus = function () {
            socket.on('status', function (info) {
                _this.setMessageData();
                var registerSend = {
                    usernames: {
                        sender: _this.messageData.sender,
                        receiver: _this.messageData.receiver
                    },
                    socketId: info.id
                };
                _this.clearUnreadMsg();
                socket.emit('registerId', registerSend);
            });
        };
        this.socketOnMsgSend = function () {
            socket.on('send-msg', function (msg) {
                msg.timeSent = _this.changeDate(msg);
                if (!_this.lastDate || _this.lastDate !== msg.timeSent.toLocaleDateString()) {
                    _this.displayMsgsDate('Today');
                    _this.lastDate = msg.timeSent.toLocaleDateString();
                }
                _this.addMessage(msg);
            });
        };
        this.socketOnMsgDelete = function () {
            //add feature
            //subtly remove delete element
            socket.on('delete-msg', function (data) {
                _this.resetDOMs("messages" /* messages */);
                var msgsChildren = _this.messages.children;
                for (var i = 0; i < msgsChildren.length; i++) {
                    if (msgsChildren[i].getAttribute('data-id') === data.msgDeleted._id) {
                        msgsChildren[i].remove();
                        console.log(msgsChildren[i - 1].innerHTML);
                    }
                }
            });
        };
        //DOM changers
        this.addMessage = function (msgObj) {
            var itemMainDiv = document.createElement('div');
            var content = "\n\t\t\t<p> " + msgObj.message + " </p>\n\t\t";
            itemMainDiv.innerHTML = content;
            var itemTimeDiv = document.createElement('p');
            itemTimeDiv.innerText = "" + _this.getTimeOnly(msgObj.timeSent);
            itemTimeDiv.style.display = 'none';
            itemTimeDiv.classList.add('msg-time');
            var itemDelDiv = document.createElement('p');
            itemDelDiv.addEventListener('click', _this.deleteMessage.bind(_this, msgObj._id));
            itemDelDiv.innerText = "Delete";
            itemDelDiv.style.display = 'none';
            itemDelDiv.classList.add('msg-delete');
            var item = document.createElement('li');
            item.addEventListener('mouseover', function () {
                if (msgObj.sender === _this.messageData.sender) {
                    itemDelDiv.style.display = 'block';
                }
                itemTimeDiv.style.display = 'block';
                setTimeout(function () {
                    itemDelDiv.style.display = 'none';
                    itemTimeDiv.style.display = 'none';
                }, 20000);
            });
            item.addEventListener('mouseleave', function () {
                itemDelDiv.style.display = 'none';
                if (msgObj.sender === _this.messageData.sender) {
                    itemTimeDiv.style.display = 'none';
                }
            });
            item.style.borderColor = _this.sideColorMap.get(msgObj.sender);
            item.dataset.id = "" + msgObj._id;
            item.classList.add('message', (msgObj.sender === _this.messageData.sender) ? 'sender' : 'receiver');
            item.appendChild(itemMainDiv);
            item.appendChild(itemTimeDiv);
            item.appendChild(itemDelDiv);
            _this.messages && _this.messages.appendChild(item);
            window.scrollTo(0, document.body.scrollHeight);
        };
        this.setStatus = function (username, onlineStatus) {
            _this.connectionStatus.style.backgroundColor = (onlineStatus) ? 'aquamarine' : 'orangered';
            _this.connectionStatus.innerHTML = "\n\t\t\t\t\t" + username + ": " + ((onlineStatus) ? 'Online' : 'Offline') + "\n\t\t\t\t";
        };
        this.displayMsgsDate = function (dateToDisplay) {
            var itemMainDiv = document.createElement('div');
            var content = "\n\t\t\t<p> " + dateToDisplay + " </p>\n\t\t";
            itemMainDiv.innerHTML = content;
            var item = document.createElement('li');
            item.classList.add('msgs-date');
            item.appendChild(itemMainDiv);
            _this.messages && _this.messages.appendChild(item);
            window.scrollTo(0, document.body.scrollHeight);
        };
        //event listeners
        this.onSendMessage = function () {
            _this.form && _this.form.addEventListener('submit', function (e) {
                e.preventDefault();
                if (_this.msgInput && _this.msgInput.value) {
                    //socket.emit('message', this.nameInput.value);
                    _this.setMessageData();
                    _this.postMessage();
                }
            });
        };
        //ajax
        this.deleteMessage = function (id, e) {
            $.ajax({
                url: "/api/message/" + id,
                type: 'DELETE'
            }).done(function (response) {
                //console.log(response);
            }).fail(function (err) {
                console.log(err);
            });
        };
        this.getAllMessages = function () {
            _this.messages.innerHTML = '';
            $.get('/api/messages')
                .done(function (response) {
                var messages = response.data.messages;
                if (messages.length === 0) {
                    _this.messages.innerHTML = 'Welcome to your chatroom, use the input box below to start sending your messages';
                }
                messages.forEach(function (msg) {
                    msg.timeSent = _this.changeDate(msg);
                    _this.addMessage(msg);
                });
            }).fail(function (err) {
                console.log(err);
            });
        };
        this.getSenderReceiverMessage = function () {
            _this.messages.innerHTML = '';
            var _a = _this.messageData, sender = _a.sender, receiver = _a.receiver;
            $.get("/api/messages/" + sender + "/" + receiver)
                .done(function (response) {
                var messages = response.data.messages;
                if (messages.length === 0) {
                    _this.messages.innerHTML = 'Welcome to your chatroom, use the input box below to start sending your messages';
                }
                _this.lastDate = '';
                messages.forEach(function (msg) {
                    msg.timeSent = _this.changeDate(msg);
                    var today = new Date().toLocaleDateString();
                    if (today !== msg.timeSent.toLocaleDateString()) {
                        if (!_this.lastDate || _this.lastDate !== msg.timeSent.toLocaleDateString()) {
                            _this.displayMsgsDate(msg.timeSent.toLocaleDateString());
                            _this.lastDate = msg.timeSent.toLocaleDateString();
                        }
                    }
                    else {
                        if (!_this.lastDate || _this.lastDate !== msg.timeSent.toLocaleDateString()) {
                            _this.displayMsgsDate('Today');
                            _this.lastDate = msg.timeSent.toLocaleDateString();
                        }
                    }
                    _this.addMessage(msg);
                });
            }).fail(function (err) {
                console.log(err);
            });
        };
        this.getUserStatus = function () {
            _this.setMessageData();
            $.get("/auth/status/" + _this.messageData.receiver)
                .done(function (response) {
                _this.setStatus(_this.messageData.receiver, response.data.status);
            })
                .fail(function (err) {
                console.log(err);
            });
        };
        this.postMessage = function () {
            if (_this.connectionStatus.style.backgroundColor === 'aquamarine') {
                _this.messageData['read'] = 'true';
            }
            else if (_this.connectionStatus.style.backgroundColor === 'orangered') {
                _this.messageData['read'] = 'false';
            }
            $.post('/api/message', _this.messageData)
                .done(function (response) {
                if (response.data.success) {
                    _this.msgInput.value = '';
                }
            }).fail(function (err) {
                console.log(err);
            });
        };
        this.clearUnreadMsg = function () {
            var data = {
                sender: _this.messageData.sender,
                receiver: _this.messageData.receiver
            };
            $.post('/api/user/clear-unread', data)
                .done(function (response) {
                if (response.data.success) {
                }
            }).fail(function (err) {
                console.log(err);
            });
        };
        //utils
        this.changeDate = function (msg) { return new Date(msg.timeSent); };
        this.getTimeOnly = function (dateObj) {
            return "\n\t\t\t" + dateObj.getHours() + ":" + ((dateObj.getMinutes() < 10) ?
                '0' + dateObj.getMinutes() : dateObj.getMinutes()) + "\n\t\t";
        };
        this.getCurrentUser = function () {
            return JSON.parse(localStorage.getItem('chatapp-user'));
        };
        this.userAvailable = function () {
            if (JSON.parse(localStorage.getItem('chatapp-user'))) {
                return true;
            }
            return false;
        };
        this.getIndexPage = function () {
            window.location.href = '/';
        };
    }
    return Messenger;
}());
var msg = new Messenger();
msg.init();
//# sourceMappingURL=chatroom.js.map