var Login = /** @class */ (function () {
    function Login() {
        var _this = this;
        this.form = document.querySelector('#login-form');
        this.usernameInput = document.querySelector('#login-username');
        this.passwordInput = document.querySelector('#login-password');
        this.getLoginData = function () {
            _this.loginData = {
                username: _this.usernameInput.value,
                password: _this.passwordInput.value
            };
        };
        this.init = function () {
            _this.form && _this.form.addEventListener('submit', function (e) {
                e.preventDefault();
                if (_this.usernameInput && _this.usernameInput.value && _this.passwordInput && _this.passwordInput.value) {
                    _this.getLoginData();
                    _this.loginRequest();
                }
            });
        };
        this.loginRequest = function () {
            $.post('/auth/login', _this.loginData)
                .done(function (response) {
                if (response.data.token) {
                    var user = {
                        token: response.data.token,
                        username: response.data.username
                    };
                    localStorage.setItem('chatapp-user', JSON.stringify(user));
                    _this.usernameInput.value = '';
                    _this.passwordInput.value = '';
                    _this.getIndexPage();
                }
            }).fail(function (err) {
                var addModalBtn = document.createElement('button');
                addModalBtn.setAttribute('type', 'button');
                addModalBtn.setAttribute('data-bs-toggle', 'modal');
                addModalBtn.setAttribute('data-bs-target', '#login-error');
                document.body.appendChild(addModalBtn);
                addModalBtn.click();
                document.body.removeChild(addModalBtn);
                console.log(err);
            });
        };
        this.getIndexPage = function () {
            window.location.href = '/';
        };
    }
    return Login;
}());
var login = new Login();
login.init();
//# sourceMappingURL=login.js.map