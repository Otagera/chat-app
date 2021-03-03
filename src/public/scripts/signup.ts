class Signup {
	signupData: { [key: string]: string } = {};
	form: Element = document.querySelector('#signup-form');
	usernameInput: HTMLInputElement = <HTMLInputElement>document.querySelector('#signup-username');
	passwordInput: HTMLInputElement = <HTMLInputElement>document.querySelector('#signup-password');
	
	getSignupData = () =>{
		this.signupData = {
			username: this.usernameInput.value,
			password: this.passwordInput.value
		};		
	}
	init = (): void =>{
		this.form && this.form.addEventListener('submit', (e)=>{
			e.preventDefault();
			if(this.usernameInput && this.usernameInput.value && this.passwordInput && this.passwordInput.value){
				this.getSignupData();
				this.loginRequest();
			}
		});
	}
	loginRequest = (): void=>{
		$.post('/auth/signup', this.signupData)
		 .done(response=>{
		 	if(response.data.success){
				this.usernameInput.value = '';
				this.passwordInput.value = '';
		 		this.getLoginPage()
		 	}
		 }).fail(err=>{
		 	console.log(err);
		 });
	}
	getLoginPage = (): void =>{
		window.location.href = '/auth/login';
	}
}

const signup = new Signup();
signup.init();
