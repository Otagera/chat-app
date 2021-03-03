
interface StorageUser {
	username: string;
	token: string;
}

class Index {
	mainDiv: HTMLElement = document.querySelector('#index-get-started');
	userNoExistDiv: HTMLElement = document.querySelector('#index-user-no-exist');
	form: HTMLElement = document.querySelector('#index-form');
	nameInput: HTMLInputElement = <HTMLInputElement>document.querySelector('#index-name');
	submitButton: HTMLElement = document.querySelector('#enter-btn');

	init(){
		this.setIndexMainDisplay();
		if(this.userAvailable()){
			this.onSubmitForm();
			this.getConversations();
		}else{
			this.form.style.display = 'none';
		}
	}

	//dom manipulator
	setIndexMainDisplay = (): void=>{
		if(this.userAvailable()){
			this.mainDiv.innerHTML = `
				<h2>Get started</h2>
				<p>
					Enter a username and you will be redirected
					to the chatroom with that user. If the user
					if the username has not yet registered with us,
					you can invite the :).
				</p>
				<h5>Most Recent Chats</h5>
				<ul id='recent-chat-list'></ul>
			`;
		}else{
			this.mainDiv.innerHTML = `
				<h2>Get an account to get started</h2>
				<h3>
					<a href="/auth/signup">
						<span>Signup</span>
					</a>
				</h3>
				<h3>
					Already got an account? 
					<a href="/auth/login">
						<span>Login</span>
					</a>
				</h3>
			`;
		}
	}
	showUserNoExistDiv = (username: string): void=>{
		this.userNoExistDiv.innerHTML = `
			<p>Sorry the username ${username} does not exist on our database.</p>
			<p>You could send an invite. :)</p>
		`;
	}
	showLoader = (): void =>{
		const itemLoaderDiv = document.createElement('div');
		itemLoaderDiv.classList.add('Loader');
		this.submitButton.innerHTML = '';
		this.submitButton && this.submitButton.appendChild(itemLoaderDiv);
	}
	addChat = (username): void =>{
		const recentChatItem = document.createElement('li');
		recentChatItem.innerHTML = `<a href='/chatroom/${username}'>${username}</a>`;
		const recentChatList = document.querySelector('#recent-chat-list');
		recentChatList.appendChild(recentChatItem);
	}

	//eventListeners
	onSubmitForm = (): void=>{
		this.form && this.form.addEventListener('submit', (e)=>{
			e.preventDefault();
			this.showLoader();
			if(this.nameInput && this.nameInput.value){
				//socket.emit('message', this.nameInput.value);
				this.chatroomRequest(this.nameInput.value);
			}
		});
	}

	//ajax
	chatroomRequest = (username: string): void=>{
		$.get(`/auth/exist/${username}`)
		 .done(response=>{
		 	//this.setStatus(this.messageData.receiver, response.data.status);
			if(response.data.status){
				this.nameInput.value = '';
				this.getChatRoomPage(username);
			}else{
				this.showUserNoExistDiv(username);
			}
		 })
		 .fail(err=>{
		 	console.log(err);
		 });
	}
	getConversations = (): void => {
		const username = this.getCurrentUser().username;
		$.get(`/api/active-conversations/${username}`)
		 .done((response)=>{
		 	const conversations: Conversation[] = response.data.conversations;
		 	if(conversations){
			 	conversations.forEach(convo=>{
					this.addChat(convo.withWho);
			 	});
		 	}
		 }).fail(err=>{
		 	console.log(err);
		 });
	}

	//utils
    getCurrentUser = (): StorageUser =>{
    	return JSON.parse(localStorage.getItem('chatapp-user'));
    }
    userAvailable = (): boolean =>{
    	if(JSON.parse(localStorage.getItem('chatapp-user'))){
    		return true;
    	}
    	return false;
    }
	getChatRoomPage = (username: string): void =>{
		window.location.href = `/chatroom/${username}`;
	}
}

const index = new Index();
index.init();