var Index = /** @class */ (function () {
    function Index() {
        var _this = this;
        this.mainDiv = document.querySelector('#index-get-started');
        this.userNoExistDiv = document.querySelector('#index-user-no-exist');
        this.form = document.querySelector('#index-form');
        this.nameInput = document.querySelector('#index-name');
        this.submitButton = document.querySelector('#enter-btn');
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
            _this.submitButton.innerHTML = '';
            _this.submitButton && _this.submitButton.appendChild(itemLoaderDiv);
        };
        this.addChat = function (username) {
            var recentChatItem = document.createElement('li');
            recentChatItem.innerHTML = "<a href='/chatroom/" + username + "'>" + username + "</a>";
            var recentChatList = document.querySelector('#recent-chat-list');
            recentChatList.appendChild(recentChatItem);
        };
        //eventListeners
        this.onSubmitForm = function () {
            _this.form && _this.form.addEventListener('submit', function (e) {
                e.preventDefault();
                _this.showLoader();
                if (_this.nameInput && _this.nameInput.value) {
                    //socket.emit('message', this.nameInput.value);
                    _this.chatroomRequest(_this.nameInput.value);
                }
            });
        };
        //ajax
        this.chatroomRequest = function (username) {
            $.get("/auth/exist/" + username)
                .done(function (response) {
                //this.setStatus(this.messageData.receiver, response.data.status);
                if (response.data.status) {
                    _this.nameInput.value = '';
                    _this.getChatRoomPage(username);
                }
                else {
                    _this.showUserNoExistDiv(username);
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
                    conversations.forEach(function (convo) {
                        _this.addChat(convo.withWho);
                    });
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
    }
    Index.prototype.init = function () {
        this.setIndexMainDisplay();
        if (this.userAvailable()) {
            this.onSubmitForm();
            this.getConversations();
        }
        else {
            this.form.style.display = 'none';
        }
    };
    return Index;
}());
var index = new Index();
index.init();
//# sourceMappingURL=index.js.map