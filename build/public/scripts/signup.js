var Signup = /** @class */ (function () {
    function Signup() {
        var _this = this;
        this.signupData = {};
        this.form = document.querySelector('#signup-form');
        this.usernameInput = document.querySelector('#signup-username');
        this.passwordInput = document.querySelector('#signup-password');
        this.getSignupData = function () {
            _this.signupData = {
                username: _this.usernameInput.value,
                password: _this.passwordInput.value
            };
        };
        this.init = function () {
            _this.form && _this.form.addEventListener('submit', function (e) {
                e.preventDefault();
                if (_this.usernameInput && _this.usernameInput.value && _this.passwordInput && _this.passwordInput.value) {
                    _this.getSignupData();
                    _this.loginRequest();
                }
            });
        };
        this.loginRequest = function () {
            $.post('/auth/signup', _this.signupData)
                .done(function (response) {
                if (response.data.success) {
                    _this.usernameInput.value = '';
                    _this.passwordInput.value = '';
                    _this.getLoginPage();
                }
            }).fail(function (err) {
                console.log(err);
            });
        };
        this.getLoginPage = function () {
            window.location.href = '/auth/login';
        };
    }
    return Signup;
}());
var signup = new Signup();
signup.init();
//# sourceMappingURL=signup.js.map