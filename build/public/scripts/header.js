var headerSocket = io();
var Header = /** @class */ (function () {
    function Header() {
        var _this = this;
        this.headerAuthDiv = document.querySelector('#header-auth');
        this.noMessages = 0;
        //sockets
        this.socketOnOnline = function () {
            headerSocket.on('unread-cleared', function (cleared) {
                if (cleared) {
                    console.log('worked');
                    _this.getConversations();
                }
            });
        };
        //eventListeners
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
            localStorage.removeItem('chatapp-user');
            _this.getIndexPage();
            _this.addHeaderAuth();
        };
        //dom
        this.addHeaderAuth = function () {
            _this.headerAuthDiv.innerHTML = '';
            if (_this.userAvailable()) {
                _this.addMessageBtn();
                var userP = document.createElement('p');
                var logoutBtn = document.createElement('button');
                userP.innerText = _this.getCurrentUser().username;
                logoutBtn.innerText = 'Logout';
                logoutBtn.addEventListener('click', _this.onLogout.bind(_this));
                _this.headerAuthDiv.appendChild(userP);
                _this.headerAuthDiv.appendChild(logoutBtn);
            }
            else {
                var signupLink = document.createElement('a');
                var loginLink = document.createElement('a');
                signupLink.setAttribute('href', "/auth/signup");
                loginLink.setAttribute('href', "/auth/login");
                signupLink.innerHTML = "<span>Signup</span>";
                loginLink.innerHTML = "<span>Login</span>";
                _this.headerAuthDiv.appendChild(signupLink);
                _this.headerAuthDiv.appendChild(loginLink);
            }
        };
        this.addMessageBtn = function () {
            var msgDiv = document.createElement('div');
            msgDiv.innerHTML = '';
            msgDiv.classList.add('msgsDiv');
            msgDiv.innerHTML = "\n\t\t\t<p>Messages</p>\n\t\t\t<span id='no-of-msgs'></span>\n\t\t\t<div id='dropDown'>\n\t\t\t\t<ul id='dropDown-ul'></ul>\n\t\t\t</div>\n\t\t";
            msgDiv.addEventListener('click', _this.onClickMessage.bind(_this));
            _this.headerAuthDiv.appendChild(msgDiv);
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
        //ajax	
        this.getConversations = function () {
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
        //utils
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
        this.getIndexPage = function () {
            window.location.href = '/';
        };
    }
    Header.prototype.init = function () {
        this.addHeaderAuth();
        this.getConversations();
        this.socketOnOnline();
        $('#dropDown').hide();
    };
    return Header;
}());
var header = new Header();
header.init();
//# sourceMappingURL=header.js.map