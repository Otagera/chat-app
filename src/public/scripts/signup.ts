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
		 	let msg = '';
		 	if(err.status === 409){
		 		msg = err.responseJSON.data.message
		 	}else{
		 		msg = "Something went terrible wrong.";
		 	}
		 	document.querySelector('#signup-err-msg').innerHTML = msg;
		 	const addModalBtn = document.createElement('button');
			addModalBtn.setAttribute('type', 'button');
			addModalBtn.setAttribute('data-bs-toggle', 'modal');
			addModalBtn.setAttribute('data-bs-target', '#signup-error');
			document.body.appendChild(addModalBtn);
			addModalBtn.click();
			document.body.removeChild(addModalBtn);
		 	console.log(err);
		 });
	}
	getLoginPage = (): void =>{
		window.location.href = '/auth/login';
	}
}

const signup = new Signup();
signup.init();
