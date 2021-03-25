var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var MsgTypeEnum;
(function (MsgTypeEnum) {
    MsgTypeEnum["text"] = "text";
    MsgTypeEnum["img"] = "img";
    MsgTypeEnum["otherfile"] = "otherfile";
})(MsgTypeEnum || (MsgTypeEnum = {}));
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
        this.emojiBtn = document.querySelector('.emoji-btn');
        this.attachBtn = document.querySelector('#chat-input-file');
        this.fileForm = document.querySelector('#send-file-form');
        // @ts-ignore
        this.picker = new FgEmojiPicker({
            trigger: ['.emoji-btn'],
            position: ['top', 'left'],
            dir: '/libs/vanilla-javascript-emoji-picker/',
            preFetch: true,
            insertInto: this.msgInput,
            emit: function (ogj, triggerElement) { }
        });
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
                _this.onAddSendTextMessage();
                _this.onAddSendFileMessage();
                _this.onTypingRelated();
                _this.onAttchBtnClick();
                //this.onEmojiKeyboardInit();
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
            _this.onRemoveSendTextMessage();
            _this.onRemoveSendFileMessage();
            _this.onTypingRelatedRemove();
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
                        _this.addTyping(userData.usernames.sender);
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
            switch (msgObj.typeOfMsg) {
                case MsgTypeEnum.text:
                    _this.addTextMessage(msgObj);
                    break;
                case MsgTypeEnum.img:
                    _this.addImgMessage(msgObj);
                    break;
                case MsgTypeEnum.otherfile:
                    _this.addOtherFileMessage(msgObj);
                    break;
                default:
                    _this.addTextMessage(msgObj);
                    break;
            }
        };
        this.addTextMessage = function (msgObj) {
            "\t\t\n            <item>\n                <itemMainDiv>\n                    //<itemAvatarDiv />\n\n                    <itemContentDiv>\n                        <itemContentWrapperDiv>\n                            <itemContentWrapperDivOne />\n\n                            <itemContentWrapperDivTwo>\n                                --inserted\n\n                                <itemDropDowmMenu>\n                                    <dropdowmFrag />\n                                </itemDropDowmMenu>\n                            </itemContentWrapperDivTwo>\n                        </itemContentWrapperDiv>\n\n                        //<itemName />\n                    </itemContentDiv>\n                </itemMainDiv>\n            </item>\n\t\t";
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
            //itemContentDiv.appendChild(itemName);
            //chat-avatar
            var itemAvatarDiv = document.createElement('div');
            itemAvatarDiv.classList.add('chat-avatar');
            itemAvatarDiv.innerHTML = "\n        <span class=\"avatar-title rounded-circle bg-soft-primary text-primary\">\n            " + msgObj.sender.charAt(0).toUpperCase() + "\n        </span>\n\t\t";
            //conversation-list
            var itemMainDiv = document.createElement('div');
            itemMainDiv.classList.add('conversation-list');
            //itemMainDiv.appendChild(itemAvatarDiv);
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
        this.addImgMessage = function (msgObj) {
            "\t\t\n            <item>\n                <itemMainDiv>\n                    //<itemAvatarDiv />\n\n                    <itemContentDiv>\n                        <itemContentWrapperDiv>\n                            <itemContentWrapperDivOne>\n\t\t\t\t\t\t\t\t<msgImg>\n\t\t\t\t\t\t\t\t\t<msgImgList>\n\t\t                            \t<msgImgListDivTwo />\n\t\t\t\t\t\t\t\t\t\t<msgImgListDivOne />\n\t\t\t\t\t\t\t\t\t</msgImgList>\n\t\t\t\t\t\t\t\t</msgImg>\n\t\t\t\t\t\t\t\t--inserted chat-time\n                            </itemContentWrapperDivOne>\n\n                            <itemContentWrapperDivTwo>\n                                --inserted\n\n                                <itemDropDowmMenu>\n                                    <dropdowmFrag />\n                                </itemDropDowmMenu>\n                            </itemContentWrapperDivTwo>\n                        </itemContentWrapperDiv>\n\n                        //<itemName />\n                    </itemContentDiv>\n                </itemMainDiv>\n            </item>\n\t\t";
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
            var msgImgListDivTwo = document.createElement('div');
            msgImgListDivTwo.classList.add('message-img-link', 'btn');
            msgImgListDivTwo.innerHTML = "\n        \t<span>\n                <i class=\"ri-download-2-line\"></i>\n            </span>\n        ";
            msgImgListDivTwo.addEventListener('click', function () {
                _this.getFIle(_this.updateFileURL(msgObj.fileURL), msgObj.message);
            });
            var msgImgListDivOne = document.createElement('div');
            msgImgListDivOne.innerHTML = "\n        \t<div>\n                <span class=\"popup-img d-inline-block m-1\" href=\"" + _this.updateFileURL(msgObj.fileURL) + "\" title=\"" + msgObj.message + "\">\n                    <img src=\"" + _this.updateFileURL(msgObj.fileURL) + "\" alt=\"\" class=\"rounded border\">\n                </span>\n            </div>\n        ";
            var msgImgList = document.createElement('li');
            msgImgList.classList.add('list-inline-item', 'message-img-list', 'me-2', 'ms-0');
            msgImgList.appendChild(msgImgListDivOne);
            msgImgList.appendChild(msgImgListDivTwo);
            var msgImg = document.createElement('ul');
            msgImg.classList.add('list-inline', 'message-img', 'mb-0');
            msgImg.appendChild(msgImgList);
            //ctext-wrap-content
            var itemContentWrapperDivOne = document.createElement('div');
            itemContentWrapperDivOne.classList.add('ctext-wrap-content');
            itemContentWrapperDivOne.insertAdjacentElement('afterbegin', msgImg);
            itemContentWrapperDivOne.insertAdjacentHTML('beforeend', "<p class=\"chat-time mb-0\"><i class=\"ri-time-line align-middle\"></i> <span class=\"align-middle\">" + _this.getTimeOnly(msgObj.timeSent) + "</span></p>");
            //ctext-wrap
            var itemContentWrapperDiv = document.createElement('div');
            itemContentWrapperDiv.classList.add('ctext-wrap');
            itemContentWrapperDiv.appendChild(itemContentWrapperDivOne);
            itemContentWrapperDiv.appendChild(itemContentWrapperDivTwo);
            //user-chat-content
            var itemContentDiv = document.createElement('div');
            itemContentDiv.classList.add('user-chat-content');
            itemContentDiv.appendChild(itemContentWrapperDiv);
            //itemContentDiv.appendChild(itemName);
            //chat-avatar
            var itemAvatarDiv = document.createElement('div');
            itemAvatarDiv.classList.add('chat-avatar');
            itemAvatarDiv.innerHTML = "\n\t        <span class=\"avatar-title rounded-circle bg-soft-primary text-primary\">\n\t            " + msgObj.sender.charAt(0).toUpperCase() + "\n\t        </span>\n\t\t";
            //conversation-list
            var itemMainDiv = document.createElement('div');
            itemMainDiv.classList.add('conversation-list');
            //itemMainDiv.appendChild(itemAvatarDiv);
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
            $(".popup-img").magnificPopup({
                type: "image",
                closeOnContentClick: true,
                mainClass: "popup-img",
                image: {
                    verticalFit: true
                }
            });
        };
        this.addOtherFileMessage = function (msgObj) {
            "\t\t\n            <item>\n                <itemMainDiv>\n                    //<itemAvatarDiv />\n\n                    <itemContentDiv>\n                        <itemContentWrapperDiv>\n                            \n                            <itemContentWrapperDivOne>\n\t\t\t\t\t\t\t\t<card>\n\t\t\t\t\t\t\t\t\t<cardInnerDiv>\n\t\t\t\t\t\t\t\t\t\t<cardInnerDivSubOne />\n\t\t\t\t\t\t\t\t\t\t<cardInnerDivSubTwo />\n\t\t\t                            <cardInnerDivSubThree />\n\t\t\t\t\t\t\t\t\t</cardInnerDiv>\n\t\t\t\t\t\t\t\t</card>\n\t\t\t\t\t\t\t\t--inserted chat-time\n                            </itemContentWrapperDivOne>\n\n                            <itemContentWrapperDivTwo>\n                                --inserted\n\n                                <itemDropDowmMenu>\n                                    <dropdowmFrag />\n                                </itemDropDowmMenu>\n                            </itemContentWrapperDivTwo>\n                        </itemContentWrapperDiv>\n\n                        //<itemName />\n                    </itemContentDiv>\n                </itemMainDiv>\n            </item>\n\t\t";
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
            var cardInnerDivSubThree = document.createElement('div');
            cardInnerDivSubThree.classList.add('ms-4', 'me-0', 'btn');
            cardInnerDivSubThree.innerHTML = "\n        \t<span>\n                <i class=\"ri-download-2-line\"></i>\n            </span>\n        ";
            cardInnerDivSubThree.addEventListener('click', function () {
                _this.getFIle(_this.updateFileURL(msgObj.fileURL), msgObj.message);
            });
            var cardInnerDivSubTwo = document.createElement('div');
            cardInnerDivSubTwo.classList.add('flex-1');
            cardInnerDivSubTwo.innerHTML = "\n\t        <div class=\"text-start\">\n                <h5 class=\"font-size-14 mb-1\">" + msgObj.message + "</h5>\n                <p class=\"text-muted font-size-13 mb-0\">" + _this.formatBytes(msgObj.fileSize) + "</p>\n            </div>\n        ";
            var cardInnerDivSubOne = document.createElement('div');
            cardInnerDivSubOne.classList.add('avatar-sm', 'me-3', 'ms-0');
            cardInnerDivSubOne.innerHTML = "\n        \t<div class=\"avatar-title bg-soft-primary text-primary rounded font-size-20\">\n                <i class=\"ri-file-text-fill\"></i>\n            </div>\n        ";
            var cardInnerDiv = document.createElement('li');
            cardInnerDiv.classList.add('d-flex', 'align-items-center');
            cardInnerDiv.appendChild(cardInnerDivSubOne);
            cardInnerDiv.appendChild(cardInnerDivSubTwo);
            cardInnerDiv.appendChild(cardInnerDivSubThree);
            var card = document.createElement('ul');
            card.classList.add('card', 'p-2', 'mb-2');
            card.appendChild(cardInnerDiv);
            //ctext-wrap-content
            var itemContentWrapperDivOne = document.createElement('div');
            itemContentWrapperDivOne.classList.add('ctext-wrap-content');
            itemContentWrapperDivOne.insertAdjacentElement('afterbegin', card);
            itemContentWrapperDivOne.insertAdjacentHTML('beforeend', "<p class=\"chat-time mb-0\"><i class=\"ri-time-line align-middle\"></i> <span class=\"align-middle\">" + _this.getTimeOnly(msgObj.timeSent) + "</span></p>");
            /*
            //ctext-wrap-content
            const itemContentWrapperDivOne = document.createElement('div');
            itemContentWrapperDivOne.classList.add('ctext-wrap-content')
            itemContentWrapperDivOne.innerHTML = `
                <div class="card p-2 mb-2">
                    <div class="d-flex align-items-center">
                        <div class="avatar-sm me-3 ms-0">
                            <div class="avatar-title bg-soft-primary text-primary rounded font-size-20">
                                <i class="ri-file-text-fill"></i>
                            </div>
                        </div>
                        <div class="flex-1">
                            <div class="text-start">
                                <h5 class="font-size-14 mb-1">${msgObj.message}</h5>
                                <p class="text-muted font-size-13 mb-0">${this.formatBytes(msgObj.fileSize)}</p>
                            </div>
                        </div>
                        <div class="ms-4 me-0">
                            <a href="${this.updateFileURL(msgObj.fileURL)}" download="${msgObj.message}" class="text-muted">
                                <i class="ri-download-2-line"></i>
                            </a>
                        </div>
                    </div>
                </div>
                <p class="chat-time mb-0"><i class="ri-time-line align-middle"></i> <span class="align-middle">${this.getTimeOnly(msgObj.timeSent)}</span></p>
            `;
            */
            //ctext-wrap
            var itemContentWrapperDiv = document.createElement('div');
            itemContentWrapperDiv.classList.add('ctext-wrap');
            itemContentWrapperDiv.appendChild(itemContentWrapperDivOne);
            itemContentWrapperDiv.appendChild(itemContentWrapperDivTwo);
            //user-chat-content
            var itemContentDiv = document.createElement('div');
            itemContentDiv.classList.add('user-chat-content');
            itemContentDiv.appendChild(itemContentWrapperDiv);
            //itemContentDiv.appendChild(itemName);
            //chat-avatar
            var itemAvatarDiv = document.createElement('div');
            itemAvatarDiv.classList.add('chat-avatar');
            itemAvatarDiv.innerHTML = "\n        <span class=\"avatar-title rounded-circle bg-soft-primary text-primary\">\n            " + msgObj.sender.charAt(0).toUpperCase() + "\n        </span>\n\t\t";
            //conversation-list
            var itemMainDiv = document.createElement('div');
            itemMainDiv.classList.add('conversation-list');
            //itemMainDiv.appendChild(itemAvatarDiv);
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
                    //figure out removing date line if no message on that date;
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
            item.dataset.id = "date";
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
                    timeSent: new Date(Date.now()),
                    typeOfMsg: MsgTypeEnum.text
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
                    timeSent: new Date(Date.now()),
                    typeOfMsg: MsgTypeEnum.text
                };
                _this.addMessage(secondMessage);
            }, 5000);
            setTimeout(function () {
                var thirdMessage = {
                    sender: 'Welcome',
                    receiver: _this.getCurrentUser().username,
                    _id: 0,
                    read: false,
                    message: "\n\t\t\t\tP.S. You can try out leo or lenzo, and ill be there to reply your message.\n\t\t\t\t",
                    timeSent: new Date(Date.now()),
                    typeOfMsg: MsgTypeEnum.text
                };
                _this.addMessage(thirdMessage);
            }, 7000);
        };
        //event listeners
        this.onAddSendTextMessage = function () { _this.form && _this.form.addEventListener('submit', _this.onSendTextSubmitCallBack); };
        this.onRemoveSendTextMessage = function () { _this.form.removeEventListener('submit', _this.onSendTextSubmitCallBack); };
        this.onSendTextSubmitCallBack = function (e) {
            e.preventDefault();
            if (_this.msgInput && _this.msgInput.value) {
                //this.socket.emit('message', this.nameInput.value);
                _this.setMessageData();
                _this.socketOnSendTyping(false);
                var data = __assign(__assign({}, _this.messageData), { typeOfMsg: MsgTypeEnum.text });
                _this.postTextMessage(data);
            }
        };
        this.onSubmitCallBackBinded = this.onSendTextSubmitCallBack.bind(this);
        this.onAddSendFileMessage = function () { _this.fileForm && _this.fileForm.addEventListener('submit', _this.onSendFileSubmitCallBack); };
        this.onRemoveSendFileMessage = function () { _this.fileForm.removeEventListener('submit', _this.onSendFileSubmitCallBack); };
        this.onSendFileSubmitCallBack = function (e) {
            e.preventDefault();
            if (_this.attachBtn && _this.attachBtn.files.length > 0 && _this.attachBtn.files[0]) {
                var file = _this.attachBtn.files[0];
                _this.setMessageData();
                _this.socketOnSendTyping(false);
                var fd = new FormData();
                fd.append('msg', file.name);
                fd.append('sender', _this.getCurrentUser().username);
                fd.append('receiver', _this.receiver);
                if (file.type.includes('image')) {
                    fd.append('typeOfMsg', MsgTypeEnum.img);
                }
                else {
                    fd.append('typeOfMsg', MsgTypeEnum.otherfile);
                }
                fd.append('fileURL', file);
                document.querySelector('.sendfile-btn-close').click();
                _this.postOtherMessage(fd);
            }
        };
        this.onTypingRelated = function () {
            // Returns a function, that, as long as it continues to be invoked, will not
            // be triggered. The function will be called after it stops being called for
            // N milliseconds. If `immediate` is passed, trigger the function on the
            // leading edge, instead of the trailing.
            //important
            _this.msgInput && _this.msgInput.addEventListener('keydown', _this.onKeydownCallback.bind(_this, 'add'));
            // This will apply the debounce effect on the keyup event
            // And it only fires 500ms or half a second after the user stopped typing
            _this.msgInput && _this.msgInput.addEventListener('keyup', _this.onKeyupCallback.bind(_this, 'add'));
        };
        this.onTypingRelatedRemove = function () {
            _this.msgInput.removeEventListener('keydown', _this.onKeydownCallback.bind(_this, 'add'));
            _this.msgInput.removeEventListener('keyup', _this.onKeyupCallback.bind(_this, 'add'));
        };
        this.onKeydownCallback = function (type, e) {
            if (type === 'add') {
                _this.socketOnSendTyping(true);
            }
        };
        this.onKeyupCallback = function (type, e) {
            if (type === 'add') {
                _this.debounce(function () {
                    _this.socketOnSendTyping(false);
                }, 5000, 0);
                _this.socketOnSendTyping(true);
            }
        };
        /*
        onEmojiKeyboardInit = (): void=>{
            this.emojiBtn.addEventListener('click', ()=>{ });
        }
        */
        this.onAttchBtnClick = function () {
            _this.attachBtn.addEventListener('change', function (e) {
                var file = e.target.files[0];
                //console.log(file);
                var addModalBtn = document.createElement('button');
                if (file.size > 5242880) {
                    addModalBtn.setAttribute('data-bs-target', '#filetolarge');
                }
                else {
                    addModalBtn.setAttribute('data-bs-target', '#sendfile');
                }
                addModalBtn.setAttribute('type', 'button');
                addModalBtn.setAttribute('data-bs-toggle', 'modal');
                document.body.appendChild(addModalBtn);
                document.querySelectorAll('.file-name')[0].innerHTML = file && file.name;
                document.querySelectorAll('.file-name')[1].innerHTML = file && file.name;
                document.querySelectorAll('.file-size')[0].innerHTML = file && _this.formatBytes(file.size);
                document.querySelectorAll('.file-size')[1].innerHTML = file && _this.formatBytes(file.size);
                addModalBtn.click();
                document.body.removeChild(addModalBtn);
            });
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
                $('.chat-conversation .simplebar-content-wrapper').scrollTop(40000);
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
        this.postTextMessage = function (data) {
            $.post('/api/message', data)
                .done(function (response) {
                if (response.data.success) {
                    _this.msgInput.value = '';
                }
            }).fail(function (err) {
                console.log(err);
            });
        };
        this.postOtherMessage = function (data) {
            $.post({
                url: '/api/message',
                data: data,
                processData: false,
                contentType: false
            }).done(function (response) {
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
        this.getFIle = function (url, filename) {
            $.ajax({
                url: url,
                xhrFields: {
                    responseType: 'blob'
                },
                success: function (response) {
                    //@ts-ignore
                    fileDownload(response, filename);
                },
                error: function () { }
            });
        };
        //utils
        this.debounce = function (func, wait, immediate) {
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
        };
        this.changeDate = function (msg) { return new Date(msg.timeSent); };
        this.getTimeOnly = function (dateObj) {
            return "\n\t\t\t" + dateObj.getHours() + ":" + ((dateObj.getMinutes() < 10) ?
                '0' + dateObj.getMinutes() : dateObj.getMinutes()) + "\n\t\t";
        };
        this.getCurrentUser = function () { return JSON.parse(localStorage.getItem('chatapp-user')); };
        this.userAvailable = function () {
            if (JSON.parse(localStorage.getItem('chatapp-user'))) {
                return true;
            }
            return false;
        };
        this.getIndexPage = function () { window.location.href = '/'; };
        this.getLoginPage = function () { window.location.href = '/login'; };
        this.formatBytes = function (bytes, decimals) {
            if (decimals === void 0) { decimals = 2; }
            if (bytes === 0)
                return '0 Bytes';
            var k = 1024;
            var dm = decimals < 0 ? 0 : decimals;
            var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
            var i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        };
    }
    Messenger.prototype.updateFileURL = function (fileURL) {
        if (window.location.origin === 'http://localhost:8080' || window.location.origin === 'http://192.168.43.240:8080') {
            return 'api/' + fileURL;
        }
        return fileURL;
    };
    return Messenger;
}());
//const msg = new Messenger();
//msg.init();
//# sourceMappingURL=chatroom.js.map