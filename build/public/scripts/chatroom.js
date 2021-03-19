;
var Messenger = /** @class */ (function () {
    function Messenger(receiver) {
        var _this = this;
        this.receiver = receiver;
        this.socket = io();
        this.lastDate = '';
        this.userProfileImgSmall = document.querySelector('.chat-user-avatar-container-small');
        this.userProfileImgBig = document.querySelector('.chat-user-avatar-container-big');
        this.userProfileName = document.querySelectorAll('.chat-user-name');
        this.userOnlineDot = document.querySelectorAll('.chat-user-online-dot');
        this.messages = document.querySelector('#chatroom-messages');
        this.form = document.querySelector('#chatroom-form');
        this.msgInput = document.querySelector('#chatroom-msg');
        this.setMessageData = function () {
            _this.messageData = {
                msg: _this.msgInput && _this.msgInput.value,
                sender: _this.getCurrentUser().username,
                receiver: _this.receiver
            };
        };
        this.resetDOMs = function (propsToReset) {
            switch (propsToReset) {
                case "messages" /* messages */:
                    _this["messages" /* messages */] = document.querySelector('#chatroom-messages');
                    break;
                case "form" /* form */:
                    _this["form" /* form */] = document.querySelector('#chatroom-form');
                    break;
                case "msgInput" /* msgInput */:
                    _this["msgInput" /* msgInput */] = document.querySelector('#chatroom-msg');
                    break;
                case "userOnlineDot" /* userOnlineDot */:
                    //this[props.userOnlineDot] = document.querySelector('.user-online-dot');
                    break;
                default:
                    break;
            }
        };
        this.init = function () {
            if (!_this.userAvailable()) {
                _this.getLoginPage();
            }
            if (_this.messages) {
                _this.messages.innerHTML = 'Loading.....';
            }
            if (_this.receiver === 'Welcome') {
                _this.welcomeSetup();
            }
            else {
                //initialize sockets
                _this.socketOnStatus();
                _this.socketOnOnline();
                _this.socketOnMsgSend();
                _this.socketOnMsgDelete();
                _this.socketOnReceiveTyping();
                _this.getUserStatus();
                _this.getSenderReceiverMessage();
                _this.onSendMessage();
                _this.onTypingRelated();
            }
        };
        //sockets
        this.socketOnOnline = function () {
            _this.socket.on('online', function (onlineInfo) {
                _this.setMessageData();
                if (onlineInfo.username === _this.messageData.receiver) {
                    _this.setStatus(onlineInfo.username, onlineInfo.online);
                }
            });
        };
        this.socketOnStatus = function () {
            _this.socket.on('status', function (info) {
                _this.setMessageData();
                var registerSend = {
                    usernames: {
                        sender: _this.messageData.sender,
                        receiver: _this.messageData.receiver
                    },
                    socketId: info.id
                };
                _this.clearUnreadMsg();
                _this.socket.emit('register-chatroom', registerSend);
            });
        };
        this.socketOnMsgSend = function () {
            _this.socket.on('send-msg', function (msg) {
                msg.timeSent = _this.changeDate(msg);
                if (!_this.lastDate || _this.lastDate !== msg.timeSent.toDateString().substr(4)) {
                    _this.displayMsgsDate('Today');
                    _this.lastDate = msg.timeSent.toLocaleDateString();
                }
                _this.addMessage(msg);
            });
        };
        this.socketOnMsgDelete = function () {
            //add feature
            //subtly remove delete element
            _this.socket.on('delete-msg', function (data) {
                _this.removeMessage(data.msgDeleted._id);
            });
        };
        this.socketOnDisconnect = function () {
            _this.socket.emit('chatroom-disconnect');
        };
        this.socketOnSendTyping = function (typing) {
            _this.socket.emit('typing', {
                usernames: {
                    sender: _this.messageData.sender,
                    receiver: _this.messageData.receiver
                },
                typing: typing
            });
        };
        this.socketOnReceiveTyping = function () {
            _this.socket.on('io-typing', function (userData) {
                if (userData.usernames.receiver === _this.messageData.sender) {
                    if (userData.typing) {
                        _this.addTyping(userData.usernames.receiver);
                    }
                    else {
                        _this.removeTyping();
                    }
                }
            });
        };
        this.socketOnClearUnread = function () {
            socket.on('unread-cleared', function (cleared) {
                if (cleared) {
                    //set message to read on display
                }
            });
        };
        //DOM changers
        this.addMessage = function (msgObj) {
            "\t\t\n            <item>\n                <itemMainDiv>\n                    <itemAvatarDiv />\n\n                    <itemContentDiv>\n                        <itemContentWrapperDiv>\n                            <itemContentWrapperDivOne />\n\n                            <itemContentWrapperDivTwo>\n                                --inserted\n\n                                <itemDropDowmMenu>\n                                    <dropdowmFrag />\n                                </itemDropDowmMenu>\n                            </itemContentWrapperDivTwo>\n                        </itemContentWrapperDiv>\n\n                        <itemName />\n                    </itemContentDiv>\n                </itemMainDiv>\n            </item>\n\t\t";
            //conversation-name
            var itemName = document.createElement('div');
            itemName.classList.add('conversation-name');
            itemName.innerHTML = "" + msgObj.sender;
            var dropdowmFrag = new DocumentFragment();
            var dropdownData = [
                { text: 'Copy', iconClass: 'file-copy' },
                { text: 'Save', iconClass: 'save' },
                { text: 'Forward', iconClass: 'chat-forward' },
                { text: 'Delete', iconClass: 'delete-bin' }
            ];
            dropdownData.forEach(function (data) {
                var dropdownItem = document.createElement('span');
                dropdownItem.addEventListener('click', _this.onMessageCollection.bind(_this, data.text, { id: msgObj._id, text: data.text }));
                //dropdownItem.addEventListener('click', this.deleteMessage.bind(this, msgObj._id));
                dropdownItem.setAttribute('role', 'button');
                dropdownItem.classList.add('dropdown-item');
                dropdownItem.innerHTML = "\n            \t" + data.text + "\n            \t<i class=\"ri-" + data.iconClass + "-line float-end text-muted\"></i>\n\t\t\t";
                dropdowmFrag.appendChild(dropdownItem);
            });
            //dropdown-menu
            var itemDropDowmMenu = document.createElement('div');
            itemDropDowmMenu.classList.add('dropdown-menu');
            itemDropDowmMenu.appendChild(dropdowmFrag);
            //dropdown
            var itemContentWrapperDivTwo = document.createElement('div');
            itemContentWrapperDivTwo.classList.add('dropdown', 'align-self-start');
            itemContentWrapperDivTwo.insertAdjacentHTML('afterbegin', "<span class=\"dropdown-toggle dropdown-click invisible\" role=\"button\" data-bs-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"false\">\n                <i class=\"ri-more-2-fill\"></i>\n            </span>");
            itemContentWrapperDivTwo.insertAdjacentElement('beforeend', itemDropDowmMenu);
            //ctext-wrap-content
            var itemContentWrapperDivOne = document.createElement('div');
            itemContentWrapperDivOne.classList.add('ctext-wrap-content');
            itemContentWrapperDivOne.innerHTML = "\n            <p class=\"mb-0\">\n                " + msgObj.message + "\n            </p>\n            <p class=\"chat-time mb-0\"><i class=\"ri-time-line align-middle\"></i> <span class=\"align-middle\">" + _this.getTimeOnly(msgObj.timeSent) + "</span></p>\t\t\t\n\t\t";
            //ctext-wrap
            var itemContentWrapperDiv = document.createElement('div');
            itemContentWrapperDiv.classList.add('ctext-wrap');
            itemContentWrapperDiv.appendChild(itemContentWrapperDivOne);
            itemContentWrapperDiv.appendChild(itemContentWrapperDivTwo);
            //user-chat-content
            var itemContentDiv = document.createElement('div');
            itemContentDiv.classList.add('user-chat-content');
            itemContentDiv.appendChild(itemContentWrapperDiv);
            itemContentDiv.appendChild(itemName);
            //chat-avatar
            var itemAvatarDiv = document.createElement('div');
            itemAvatarDiv.classList.add('chat-avatar');
            itemAvatarDiv.innerHTML = "\n        <span class=\"avatar-title rounded-circle bg-soft-primary text-primary\">\n            " + msgObj.sender.charAt(0).toUpperCase() + "\n        </span>\n\t\t";
            //conversation-list
            var itemMainDiv = document.createElement('div');
            itemMainDiv.classList.add('conversation-list');
            itemMainDiv.appendChild(itemAvatarDiv);
            itemMainDiv.appendChild(itemContentDiv);
            var item = document.createElement('li');
            item.addEventListener('mouseover', _this.onHoverMessage.bind(_this));
            item.addEventListener('touchstart', _this.onHoverMessage.bind(_this));
            item.addEventListener('mouseleave', _this.onHoverLeaveMessage.bind(_this));
            item.addEventListener('touchend', _this.onHoverLeaveMessage.bind(_this));
            item.dataset.id = "" + msgObj._id;
            item.classList.add((msgObj.sender === _this.messageData.sender) ? 'right' : 'irrelevant');
            item.appendChild(itemMainDiv);
            //OLD
            _this.messages && _this.messages.appendChild(item);
            $('.chat-conversation .simplebar-content-wrapper').scrollTop(40000);
        };
        this.removeMessage = function (id) {
            _this.resetDOMs("messages" /* messages */);
            var msgsChildren = _this.messages.children;
            for (var i = 0; i < msgsChildren.length; i++) {
                if (msgsChildren[i].getAttribute('data-id') === id) {
                    msgsChildren[i].remove();
                }
            }
        };
        this.addTyping = function (whoistyping) {
            var typingExist = false;
            _this.resetDOMs("messages" /* messages */);
            var msgsChildren = _this.messages.children;
            for (var i = 0; i < msgsChildren.length; i++) {
                if (msgsChildren[i].getAttribute('data-id') === 'typing') {
                    typingExist = true;
                }
            }
            //conversation-list
            var itemMainDiv = document.createElement('div');
            itemMainDiv.classList.add('conversation-list');
            itemMainDiv.innerHTML = "\n            <div class=\"chat-avatar\">\n                <span class=\"avatar-title rounded-circle bg-soft-primary text-primary\">\n\t\t            " + whoistyping.charAt(0).toUpperCase() + "\n\t\t        </span>\n            </div>\n            \n            <div class=\"user-chat-content\">\n                <div class=\"ctext-wrap\">\n                    <div class=\"ctext-wrap-content\">\n                        <p class=\"mb-0\">\n                            typing\n                            <span class=\"animate-typing\">\n                                <span class=\"dot\"></span>\n                                <span class=\"dot\"></span>\n                                <span class=\"dot\"></span>\n                            </span>\n                        </p>\n                    </div>\n                </div>\n\n                <div class=\"conversation-name\">" + whoistyping + "</div>\n            </div>\n\t\t";
            if (!typingExist) {
                var item = document.createElement('li');
                item.dataset.id = "typing";
                item.appendChild(itemMainDiv);
                _this.messages && _this.messages.appendChild(item);
                $('.chat-conversation .simplebar-content-wrapper').scrollTop(40000);
            }
        };
        this.removeTyping = function () {
            _this.resetDOMs("messages" /* messages */);
            var msgsChildren = _this.messages.children;
            for (var i = 0; i < msgsChildren.length; i++) {
                if (msgsChildren[i].getAttribute('data-id') === 'typing') {
                    msgsChildren[i].remove();
                }
            }
        };
        this.setStatus = function (username, onlineStatus) {
            _this.userProfileName[0].innerHTML = username;
            _this.userProfileName[1].innerHTML = username;
            _this.userProfileImgSmall.innerHTML = "\n                        <!-- <img src=\"/images/users/avatar-4.jpg\" class=\"rounded-circle avatar-xs\" alt=\"\"> -->\n                        <div class=\"chat-user-img online align-self-center me-1 ms-0\">\n\t                        <div class=\"avatar-xs\">\n\t\t                        <span class=\"avatar-title rounded-circle bg-soft-primary text-primary\">\n\t\t                            " + username.charAt(0).toUpperCase() + "\n\t\t                        </span>\n\t\t                    </div>\n\t                    </div>\n\t\t";
            _this.userProfileImgBig.innerHTML = "" + username.charAt(0).toUpperCase();
            if (onlineStatus) {
                _this.userOnlineDot[0].classList.remove('text-warning');
                _this.userOnlineDot[0].classList.add('text-primary');
                _this.userOnlineDot[1].classList.remove('text-warning');
                _this.userOnlineDot[1].classList.add('text-primary');
            }
            else {
                _this.userOnlineDot[0].classList.add('text-warning');
                _this.userOnlineDot[0].classList.remove('text-primary');
                _this.userOnlineDot[1].classList.add('text-warning');
                _this.userOnlineDot[1].classList.remove('text-primary');
            }
        };
        this.displayMsgsDate = function (dateToDisplay) {
            var itemMainDiv = document.createElement('div');
            var content = "\n\t\t\t<span class=\"title\"> " + dateToDisplay + " </span>\n\t\t";
            itemMainDiv.classList.add('chat-day-title');
            itemMainDiv.innerHTML = content;
            var item = document.createElement('li');
            item.appendChild(itemMainDiv);
            _this.messages && _this.messages.appendChild(item);
            window.scrollTo(0, document.body.scrollHeight);
        };
        this.welcomeSetup = function () {
            _this.setMessageData();
            _this.setStatus(_this.messageData.receiver, true);
            _this.messages.innerHTML = '';
            setTimeout(function () {
                var firstMessage = {
                    sender: 'Welcome',
                    receiver: _this.getCurrentUser().username,
                    _id: 0,
                    read: false,
                    message: "Welcome " + _this.getCurrentUser().username + " to my chatapp",
                    timeSent: new Date(Date.now())
                };
                _this.addMessage(firstMessage);
            }, 2000);
            setTimeout(function () {
                var secondMessage = {
                    sender: 'Welcome',
                    receiver: _this.getCurrentUser().username,
                    _id: 0,
                    read: false,
                    message: "\n\t\t\t\tTo get started you can start sending messages to friends that have already signed up to our platform,\n\t\t\t\tall you'll need is the username, click on the add chat button <i class=\"ri-user-add-line\"></i> on the\n\t\t\t\thome button and youself can get started.\n\t\t\t\t",
                    timeSent: new Date(Date.now())
                };
                _this.addMessage(secondMessage);
            }, 5000);
            setTimeout(function () {
                var secondMessage = {
                    sender: 'Welcome',
                    receiver: _this.getCurrentUser().username,
                    _id: 0,
                    read: false,
                    message: "\n\t\t\t\tP.S. You can try out leo or lenzo, and ill be there to reply your message.\n\t\t\t\t",
                    timeSent: new Date(Date.now())
                };
                _this.addMessage(secondMessage);
            }, 7000);
        };
        //event listeners
        this.onSendMessage = function () {
            _this.form && _this.form.addEventListener('submit', function (e) {
                e.preventDefault();
                if (_this.msgInput && _this.msgInput.value) {
                    //this.socket.emit('message', this.nameInput.value);
                    _this.setMessageData();
                    _this.socketOnSendTyping(false);
                    _this.postMessage();
                    console.log(_this.form);
                }
            });
        };
        this.onTypingRelated = function () {
            // Returns a function, that, as long as it continues to be invoked, will not
            // be triggered. The function will be called after it stops being called for
            // N milliseconds. If `immediate` is passed, trigger the function on the
            // leading edge, instead of the trailing.
            function debounce(func, wait, immediate) {
                var timeout;
                return function () {
                    var context = this, args = arguments;
                    var later = function () {
                        timeout = null;
                        if (!immediate)
                            func.apply(context, args);
                    };
                    var callNow = immediate && !timeout;
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                    if (callNow)
                        func.apply(context, args);
                };
            }
            ;
            //important
            _this.msgInput && _this.msgInput.addEventListener('keydown', function (e) {
                _this.socketOnSendTyping(true);
            });
            // This will apply the debounce effect on the keyup event
            // And it only fires 500ms or half a second after the user stopped typing
            _this.msgInput && _this.msgInput.addEventListener('keyup', debounce(function () {
                _this.socketOnSendTyping(false);
            }, 5000, 0));
        };
        this.onMessageCollection = function (type, otherData, e) {
            switch (type) {
                case "Delete":
                    _this.deleteMessage(otherData.id, e);
                    break;
                case "Copy":
                    _this.onCopy(otherData.text, e);
                    break;
                default:
                    // code...
                    break;
            }
        };
        this.onCopy = function (text, e) {
            var fallbackCopy = function (text) {
                var textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.top = '0';
                textArea.style.left = '0';
                textArea.style.position = 'fixed';
                document.appendChild(textArea);
                textArea.focus();
                textArea.select();
                textArea.setSelectionRange(0, 9999999);
                try {
                    var successful = document.execCommand('copy');
                    var msg = successful ? 'successful' : 'unsuccessful';
                    //console.log('Fallback: Copying text command was ' + msg);
                }
                catch (err) {
                    console.error('Fallback: Oops, unable to copy', err);
                }
                document.body.removeChild(textArea);
            };
            if (!navigator.clipboard) {
                fallbackCopy(text);
                return;
            }
            navigator.clipboard.writeText(text).then(function () {
                //console.log('Async: Copying to clipboard was successful!');
            }, function (err) {
                console.error('Async: Could not copy text: ', err);
            });
        };
        this.onHoverMessage = function (e) {
            //console.log(e.type);
            //console.log(e.target);
            var dropdown = e.target;
            if (dropdown.classList.contains('ctext-wrap-content')) {
                dropdown.nextElementSibling.children[0].classList.add('visible');
                dropdown.nextElementSibling.children[0].classList.remove('invisible');
                setTimeout(function () {
                    dropdown.nextElementSibling.children[0].classList.remove('visible');
                    dropdown.nextElementSibling.children[0].classList.add('invisible');
                }, 20000);
            }
        };
        this.onHoverLeaveMessage = function (e) {
            var dropdown = e.target;
            if (dropdown.classList.contains('ctext-wrap-content')) {
                dropdown.nextElementSibling.children[0].classList.remove('visible');
                dropdown.nextElementSibling.children[0].classList.add('invisible');
            }
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
            $.get('/api/messages/all')
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
            if (_this.messages) {
                _this.messages.innerHTML = '';
            }
            var _a = _this.messageData, sender = _a.sender, receiver = _a.receiver;
            $.get("/api/messages/all/" + sender + "/" + receiver)
                .done(function (response) {
                var messages = response.data.messages;
                if (messages.length === 0) {
                    _this.messages.innerHTML = 'Welcome to your chatroom, use the input box below to start sending your messages';
                }
                _this.lastDate = '';
                messages.forEach(function (msg) {
                    msg.timeSent = _this.changeDate(msg);
                    var today = new Date().toDateString().substr(4);
                    if (today !== msg.timeSent.toDateString().substr(4)) {
                        if (!_this.lastDate || _this.lastDate !== msg.timeSent.toDateString().substr(4)) {
                            _this.displayMsgsDate(msg.timeSent.toDateString().substr(4));
                            _this.lastDate = msg.timeSent.toDateString().substr(4);
                        }
                    }
                    else {
                        if (!_this.lastDate || _this.lastDate !== msg.timeSent.toDateString().substr(4)) {
                            _this.displayMsgsDate('Today');
                            _this.lastDate = msg.timeSent.toDateString().substr(4);
                        }
                    }
                    _this.addMessage(msg);
                });
                $('.chat-conversation .simplebar-content-wrapper').scrollTop(4000);
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
            $.post('/api/message', _this.messageData)
                .done(function (response) {
                if (response.data.success) {
                    _this.msgInput.value = '';
                    console.log(_this.form);
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
        this.getLoginPage = function () {
            window.location.href = '/login';
        };
    }
    return Messenger;
}());
//const msg = new Messenger();
//msg.init();
//# sourceMappingURL=chatroom.js.map