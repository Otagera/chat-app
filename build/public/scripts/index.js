//nothin cause it'll assume that its all on the same server alse put io(url)
var socket = io();
var Index = /** @class */ (function () {
    function Index() {
        var _this = this;
        this.noMessages = 0;
        this.withWhos = [];
        this.withWhosOnDisplay = [];
        this.mainDiv = document.querySelector('#index-get-started');
        this.userNoExistDiv = document.querySelector('#index-user-no-exist');
        this.newChatForm = document.querySelector('#new-chat-form');
        this.newChatNameInput = document.querySelector('#new-chat-name-input');
        this.newChatSubmitButton = document.querySelector('#new-chat-submit-button');
        this.logoutButton = document.querySelector('.logout-btn');
        this.headerAuthDiv = document.querySelector('#header-auth');
        //sockets
        this.socketOnOnline = function () {
            socket.on('online', function (onlineInfo) {
                _this.withWhos.forEach(function (withWho) {
                    if (onlineInfo.username === withWho) {
                        if (onlineInfo.online) {
                            if (!_this.withWhosOnDisplay.includes(onlineInfo.username)) {
                                _this.withWhosOnDisplay.push(onlineInfo.username);
                                _this.addActiveUser(onlineInfo.username);
                            }
                        }
                        else {
                            var index_1 = _this.withWhosOnDisplay.indexOf(onlineInfo.username);
                            if (index_1 !== -1) {
                                _this.withWhosOnDisplay.splice(index_1, 1);
                                _this.removeActiveUser(index_1);
                            }
                        }
                    }
                });
            });
        };
        this.socketOnClearUnread = function () {
            socket.on('unread-cleared', function (cleared) {
                if (cleared) {
                    //this.getConversations();
                    _this.getLatestMessages();
                }
            });
        };
        this.socketOnStatus = function () {
            socket.on('status', function (info) {
                var registerSend = {
                    username: _this.getCurrentUser().username,
                    socketId: info.id
                };
                socket.emit('register-id', registerSend);
            });
        };
        this.socketOnMsgSend = function () {
            socket.on('send-msg', function (msg) {
                _this.replaceUserChat(msg);
            });
        };
        //dom manipulator
        this.setIndexMainDisplay = function () {
            if (_this.userAvailable()) {
                _this.mainDiv.innerHTML = "\n\t\t\t\t<h2>Get started</h2>\n\t\t\t\t<p>\n\t\t\t\t\tEnter a username and you will be redirected\n\t\t\t\t\tto the chatroom with that user. If the user\n\t\t\t\t\tif the username has not yet registered with us,\n\t\t\t\t\tyou can invite the :).\n\t\t\t\t</p>\n\t\t\t\t<h5>Most Recent Chats</h5>\n\t\t\t\t<ul id='recent-chat-list'></ul>\n\t\t\t";
            }
            else {
                _this.mainDiv.innerHTML = "\n\t\t\t\t<h2>Get an account to get started</h2>\n\t\t\t\t<h3>\n\t\t\t\t\t<a href=\"/auth/signup\">\n\t\t\t\t\t\t<span>Signup</span>\n\t\t\t\t\t</a>\n\t\t\t\t</h3>\n\t\t\t\t<h3>\n\t\t\t\t\tAlready got an account? \n\t\t\t\t\t<a href=\"/auth/login\">\n\t\t\t\t\t\t<span>Login</span>\n\t\t\t\t\t</a>\n\t\t\t\t</h3>\n\t\t\t";
            }
        };
        this.showUserNoExistDiv = function (username) {
            _this.userNoExistDiv.innerHTML = "\n\t\t\t<p>Sorry the username " + username + " does not exist on our database.</p>\n\t\t\t<p>You could send an invite. :)</p>\n\t\t";
        };
        this.showLoader = function () {
            var itemLoaderDiv = document.createElement('div');
            itemLoaderDiv.classList.add('Loader');
            _this.newChatSubmitButton.innerHTML = '';
            _this.newChatSubmitButton && _this.newChatSubmitButton.appendChild(itemLoaderDiv);
        };
        this.removeLoader = function () {
            var itemLoaderDiv = document.querySelector('.Loader');
            _this.newChatSubmitButton && _this.newChatSubmitButton.removeChild(itemLoaderDiv);
            _this.newChatSubmitButton.innerHTML = 'Start Chat';
        };
        this.addActiveUser = function (username) {
            //for online
            //<div class="avatar-xs mx-auto d-block chat-user-img online">
            //image
            //<img src="/images/users/avatar-2.jpg" alt="user-img" class="img-fluid rounded-circle">
            _this.activeUsersCarousel.trigger('add.owl.carousel', [$("\n\t\t\t<div class=\"item\">\n\t            <span class=\"user-status-box\" id=\"user-status-box-" + username + "\" role=\"button\">\n\t                <div class=\"avatar-xs mx-auto d-block chat-user-img away online\">\n\t                    <span class=\"avatar-title rounded-circle bg-soft-primary text-primary\">\n\t                        " + username.charAt(0).toUpperCase() + "\n\t                    </span>\n\t                </div>\n\t                <span class=\"user-status\"></span>\n\t                <h5 class=\"font-size-13 text-truncate mt-3 mb-1\">" + username + "</h5>\n\t            </span>\n            </div>\n\t\t")]).trigger('refresh.owl.carousel');
            var newUser = document.querySelector("#user-status-box-" + username);
            newUser.addEventListener('click', _this.onClickChat.bind(_this, username));
            /*
            newUser.addEventListener('click', ()=>{
                        $(".user-chat").addClass("user-chat-show");
                    });
            */
        };
        this.removeActiveUser = function (index) {
            //this.activeUsersCarousel.removeItem(index).trigger('refresh.owl.carousel');
            _this.activeUsersCarousel.trigger('remove.owl.carousel', index).trigger('refresh.owl.carousel');
        };
        this.addUserChat = function (msg, timeToDisplay, position) {
            if (position === void 0) { position = 'append'; }
            /**
            * online: <div class="chat-user-img online align-self-center me-3 ms-0">
            * offline: <div class="chat-user-img away align-self-center me-3 ms-0">
            * nothing: <div class="chat-user-img align-self-center me-3 ms-0">
            */
            //<a href="#"></a>
            //status
            //<span class="user-status"></span>
            var receiver = (msg.receiver === _this.getCurrentUser().username) ? msg.sender : msg.receiver;
            var unread = (!msg.read && msg.sender !== _this.getCurrentUser().username) ? "\n\t\t\t\t<div class=\"unread-message\">\n                    <span class=\"badge badge-soft-danger rounded-pill\">01</span>\n                </div>" : " ";
            var chatItem = document.createElement('li');
            chatItem.innerHTML = "\n\t\t\t<span class=\"chat-list-span\" role=\"button\">\n                <div class=\"d-flex\">                            \n                    <div class=\"chat-user-img online align-self-center me-3 ms-0\">\n                        <div class=\"avatar-xs\">\n\t                        <span class=\"avatar-title rounded-circle bg-soft-primary text-primary\">\n\t                            " + receiver.charAt(0).toUpperCase() + "\n\t                        </span>\n\t                    </div>\n                    </div>\n                    <div class=\"flex-1 overflow-hidden\">\n                        <h5 class=\"text-truncate font-size-15 mb-1\">" + receiver + "</h5>\n                        <p class=\"chat-user-message text-truncate mb-0\">" + msg.message + "</p>\n                    </div>\n                    <div class=\"font-size-11\">" + timeToDisplay + "</div>\n                    " + unread + "\n                </div>\n            </span>\n\t\t";
            chatItem.addEventListener('click', _this.onClickChat.bind(_this, receiver));
            /*
            chatItem.addEventListener('click', ()=>{
                $(".user-chat").addClass("user-chat-show");
            });
            */
            chatItem.dataset.userReceiver = "" + msg.receiver;
            chatItem.dataset.userSender = "" + msg.sender;
            var chatList = document.querySelector('.chat-list');
            if (position === 'append') {
                chatList.appendChild(chatItem);
            }
            else if (position === 'prepend') {
                chatList.prepend(chatItem);
                ;
            }
        };
        this.replaceUserChat = function (msg) {
            _this.removeUserChat(msg.sender, msg.receiver);
            msg.timeSent = _this.changeDate(msg);
            _this.addUserChat(msg, _this.getUserChatTime(msg), 'prepend');
        };
        this.removeUserChat = function (sender, receiver) {
            var chatList = document.querySelector('.chat-list');
            var chatListChildren = chatList.children;
            for (var i = 0; i < chatListChildren.length; i++) {
                if (chatListChildren[i].getAttribute('data-user-sender') === sender &&
                    chatListChildren[i].getAttribute('data-user-receiver') === receiver ||
                    chatListChildren[i].getAttribute('data-user-sender') === receiver &&
                        chatListChildren[i].getAttribute('data-user-receiver') === sender) {
                    chatListChildren[i].remove();
                }
            }
        };
        this.setProfileDetails = function () {
            var subNames = document.querySelectorAll('.profile-user-img');
            for (var i = 0; i < subNames.length; i++) {
                subNames[i].innerHTML = _this.getCurrentUser().username.charAt(0).toUpperCase();
            }
            var names = document.querySelectorAll('.profile-user-name');
            for (var i = 0; i < names.length; i++) {
                names[i].innerHTML = _this.getCurrentUser().username;
            }
        };
        this.setWelcomePackage = function () {
            var testMsg = {
                sender: 'Lenzo',
                receiver: 'Welcome',
                _id: 0,
                read: false,
                message: 'Welcome to my chatapp, Click me!!',
                timeSent: new Date(Date.now())
            };
            _this.addUserChat(testMsg, _this.getTimeOnly(testMsg.timeSent));
        };
        this.queryStarters = function () {
            $(".dropdown-menu a.dropdown-toggle").on("click", function (t) {
                return $(this).next().hasClass("show")
                    ||
                        $(this).parents(".dropdown-menu")
                            .first()
                            .find(".show")
                            .removeClass("show"),
                    $(this).next(".dropdown-menu")
                        .toggleClass("show"),
                    !1;
            });
            $(function () {
                //tooltip for displaying the title of whatever is hovered on
                $('[data-toggle="tooltip"]').tooltip();
            });
            $(function () {
                $('[data-toggle="popover"]').popover();
            });
            $("#light-dark").on("click", function (t) {
                "disabled" !== $("#bootstrap-style").attr("disabled")
                    ?
                        ($("#bootstrap-dark-style").prop("disabled", false),
                            $("#bootstrap-style").prop("disabled", true),
                            $("#app-dark-style").prop("disabled", false),
                            $("#app-style").prop("disabled", true))
                    :
                        ($("#bootstrap-dark-style").prop("disabled", true),
                            $("#bootstrap-style").prop("disabled", false),
                            $("#app-dark-style").prop("disabled", true),
                            $("#app-style").prop("disabled", false));
            });
            //magnify image to see in full screen
            $(".popup-img").magnificPopup({
                type: "image",
                closeOnContentClick: true,
                mainClass: "mfp-img-mobile",
                image: {
                    verticalFit: true
                }
            });
            _this.activeUsersCarousel = $("#user-status-carousel").owlCarousel({
                items: 4,
                loop: false,
                margin: 16,
                nav: false,
                dots: false
            });
            $("#chatinputmorelink-carousel").owlCarousel({
                items: 2,
                loop: false,
                margin: 16,
                nav: false,
                dots: false,
                responsive: {
                    0: { items: 2 },
                    600: {
                        items: 5,
                        nav: false
                    },
                    992: { items: 8 }
                }
            });
            $("#user-profile-hide").click(function () {
                //to close the user profile sidebar, if its opened it'll hide it
                $(".user-profile-sidebar").hide();
                document.querySelector('.chat-input-section').classList.add('fixed-bottom');
            });
            $(".user-profile-show").click(function () {
                //show user profile sidebar
                $(".user-profile-sidebar").show();
                document.querySelector('.chat-input-section').classList.remove('fixed-bottom');
            });
            $(".chat-user-list li a").click(function () {
                //show chat
                $(".user-chat").addClass("user-chat-show");
            });
            $(".user-chat-remove").click(function () {
                _this.chatroom.socketOnDisconnect();
                //in mobile view remove user chats
                $(".user-chat").removeClass("user-chat-show");
            });
            var toggle = function (e, type) {
                if (e.matches) {
                    if (type === 'add') {
                        document.querySelector('.chat-input-section').classList.add('fixed-bottom');
                    }
                    else if (type === 'remove') {
                        document.querySelector('.chat-input-section').classList.remove('fixed-bottom');
                    }
                    else {
                        document.querySelector('.chat-input-section').classList.toggle('fixed-bottom');
                    }
                }
            };
            var mediaQueryGoesAbove = window.matchMedia('(min-width: 992px)');
            var mediaQueryGoesBelow = window.matchMedia('(max-width: 992px)');
            toggle(mediaQueryGoesAbove, 'remove');
            toggle(mediaQueryGoesBelow, 'add');
            mediaQueryGoesAbove.addListener(function (e) {
                toggle(e, 'remove');
            });
            mediaQueryGoesBelow.addListener(function (e) {
                toggle(e, 'add');
            });
        };
        //header
        this.addHeaderAuth = function () {
            if (_this.headerAuthDiv) {
                _this.headerAuthDiv.innerHTML = '';
            }
            if (_this.userAvailable()) {
                _this.addMessageBtn();
                var userP = document.createElement('p');
                var logoutBtn = document.createElement('button');
                userP.innerText = _this.getCurrentUser().username;
                logoutBtn.innerText = 'Logout';
                logoutBtn.addEventListener('click', _this.onLogout.bind(_this));
                _this.headerAuthDiv && _this.headerAuthDiv.appendChild(userP);
                _this.headerAuthDiv && _this.headerAuthDiv.appendChild(logoutBtn);
            }
            else {
                var signupLink = document.createElement('a');
                var loginLink = document.createElement('a');
                signupLink.setAttribute('href', "/auth/signup");
                loginLink.setAttribute('href', "/auth/login");
                signupLink.innerHTML = "<span>Signup</span>";
                loginLink.innerHTML = "<span>Login</span>";
                _this.headerAuthDiv && _this.headerAuthDiv.appendChild(signupLink);
                _this.headerAuthDiv && _this.headerAuthDiv.appendChild(loginLink);
            }
        };
        this.addMessageBtn = function () {
            var msgDiv = document.createElement('div');
            msgDiv.innerHTML = '';
            msgDiv.classList.add('msgsDiv');
            msgDiv.innerHTML = "\n\t\t\t<p>Messages</p>\n\t\t\t<span id='no-of-msgs'></span>\n\t\t\t<div id='dropDown'>\n\t\t\t\t<ul id='dropDown-ul'></ul>\n\t\t\t</div>\n\t\t";
            msgDiv.addEventListener('click', _this.onClickMessage.bind(_this));
            _this.headerAuthDiv && _this.headerAuthDiv.appendChild(msgDiv);
        };
        this.addConvo = function (convo) {
            var dropDownLi = document.createElement('li');
            dropDownLi.innerHTML = "<a href='/chatroom/" + convo.withWho + "'>" + convo.withWho + "(" + convo.unreadMsgs + ")</a>";
            var dropDownUl = document.querySelector('#dropDown-ul');
            dropDownUl.appendChild(dropDownLi);
        };
        this.setTotalMessages = function (noMsgs) {
            var noSpan = document.querySelector('#no-of-msgs');
            noSpan.innerHTML = "(" + noMsgs + ")";
        };
        //eventListeners
        this.onSubmitForm = function () {
            _this.newChatForm.addEventListener('submit', function (e) {
                e.preventDefault();
                _this.showLoader();
                if (_this.newChatNameInput && _this.newChatNameInput.value) {
                    //socket.emit('message', this.newChatNameInput.value);
                    _this.chatroomRequest(_this.newChatNameInput.value);
                    _this.removeLoader();
                }
            });
        };
        this.onClickMessage = function () {
            if ($('#dropDown').is(':hidden')) {
                $('#dropDown').slideDown('slow');
            }
            else {
                $('#dropDown').slideUp('slow');
            }
            /*const list: HTMLElement = document.querySelector('#dropDown');
            if(this.noMessages > 0){
                list.classList.toggle('show-list');
            }*/
        };
        this.onLogout = function () {
            _this.logoutButton.addEventListener('click', function () {
                localStorage.removeItem('chatapp-user');
                _this.getLoginPage();
                _this.addHeaderAuth();
            });
        };
        this.onClickChat = function (username) {
            _this.chatroom && _this.chatroom.socketOnDisconnect();
            _this.chatroom = new Messenger(username);
            _this.chatroom.init();
            $(".user-chat").addClass("user-chat-show");
        };
        //ajax
        this.chatroomRequest = function (username) {
            $.get("/auth/exist/" + username)
                .done(function (response) {
                var closeBtn = document.querySelector('.btn-close');
                if (response.data.status) {
                    _this.onClickChat(_this.newChatNameInput.value);
                    closeBtn.click();
                    _this.newChatNameInput.value = '';
                    //this.getChatRoomPage(username);
                }
                else {
                    console.log('no exist');
                    //<button type="button" class="btn btn-link text-decoration-none text-muted font-size-18 py-0" data-bs-toggle="modal" data-bs-target="#addChat">
                    var addModalBtn = document.createElement('button');
                    addModalBtn.setAttribute('type', 'button');
                    addModalBtn.setAttribute('data-bs-toggle', 'modal');
                    addModalBtn.setAttribute('data-bs-target', '#user-no-exist');
                    document.body.appendChild(addModalBtn);
                    document.querySelector('#username-no-exist-span').innerHTML = username;
                    closeBtn.click();
                    addModalBtn.click();
                    document.body.removeChild(addModalBtn);
                }
            })
                .fail(function (err) {
                console.log(err);
            });
        };
        this.getConversations = function () {
            var username = _this.getCurrentUser().username;
            $.get("/api/active-conversations/" + username)
                .done(function (response) {
                var conversations = response.data.conversations;
                if (conversations) {
                    var withWhos_1 = [];
                    conversations.forEach(function (convo) {
                        _this.getUserStatus(convo.withWho)
                            .done(function (response) {
                            if (response.data.status) {
                                if (!_this.withWhosOnDisplay.includes(convo.withWho)) {
                                    _this.addActiveUser(convo.withWho);
                                    _this.withWhosOnDisplay.push(convo.withWho);
                                }
                            }
                        })
                            .fail(function (err) {
                            console.log(err);
                        });
                        withWhos_1.push(convo.withWho);
                    });
                    _this.withWhos = withWhos_1;
                }
            }).fail(function (err) {
                console.log(err);
            });
        };
        this.getLatestMessages = function () {
            var username = _this.getCurrentUser().username;
            $.get("/api/messages/recent/" + username)
                .done(function (response) {
                //next to do sort by time and display time or date
                var msgs = response.data.messages;
                if (msgs.length > 0) {
                    msgs.sort(function (a, b) {
                        var aa = new Date(a.timeSent);
                        var bb = new Date(b.timeSent);
                        return (bb.valueOf() - aa.valueOf());
                    });
                    msgs.forEach(function (msg) {
                        //create api endpoint to check unread messages;
                        msg.timeSent = _this.changeDate(msg);
                        _this.addUserChat(msg, _this.getUserChatTime(msg));
                    });
                    //this.setWelcomePackage();
                }
                else {
                    _this.setWelcomePackage();
                }
            }).fail(function (err) {
                console.log(err);
            });
        };
        //header
        this.getHeaderConversations = function () {
            var username = _this.getCurrentUser().username;
            $.get("/api/active-conversations/" + username)
                .done(function (response) {
                var conversations = response.data.conversations;
                if (conversations) {
                    conversations.forEach(function (convo) {
                        if (convo.unreadMsgs > 0) {
                            _this.noMessages += convo.unreadMsgs;
                            _this.addConvo(convo);
                        }
                    });
                    if (_this.noMessages > 0) {
                        _this.setTotalMessages(_this.noMessages);
                    }
                }
            }).fail(function (err) {
                console.log(err);
            });
        };
        this.getUserStatus = function (username) {
            return $.get("/auth/status/" + username);
        };
        //utils
        this.changeDate = function (msg) { return new Date(msg.timeSent); };
        this.getTimeOnly = function (dateObj) {
            return "\n\t\t\t" + dateObj.getHours() + ":" + ((dateObj.getMinutes() < 10) ?
                '0' + dateObj.getMinutes() : dateObj.getMinutes()) + "\n\t\t";
        };
        this.getUserChatTime = function (msg) {
            var today = new Date().toDateString().substr(4);
            var timeToDisplay = '';
            if (today !== msg.timeSent.toDateString().substr(4)) {
                timeToDisplay = msg.timeSent.toDateString().substr(4);
            }
            else {
                timeToDisplay = _this.getTimeOnly(msg.timeSent);
            }
            return timeToDisplay;
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
        this.getChatRoomPage = function (username) {
            window.location.href = "/chatroom/" + username;
        };
        //header
        this.getIndexPage = function () {
            window.location.href = '/';
        };
        this.getLoginPage = function () {
            window.location.href = '/auth/login';
        };
    }
    Index.prototype.init = function () {
        this.queryStarters();
        //this.setIndexMainDisplay();
        if (this.userAvailable()) {
            this.socketOnStatus();
            this.socketOnOnline();
            this.socketOnMsgSend();
            this.onSubmitForm();
            this.getConversations();
            this.getLatestMessages();
            this.setProfileDetails();
            this.onLogout();
            //from header
            this.addHeaderAuth();
            //this.getHeaderConversations();
            $('#dropDown').hide();
        }
        else {
            this.getLoginPage();
        }
        //used in only 3 places, the 3 buttons beside the input fielf for send message
        // @ts-ignore
        Waves.init();
    };
    return Index;
}());
var index = new Index();
index.init();
//# sourceMappingURL=index.js.map