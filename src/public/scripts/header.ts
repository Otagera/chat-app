
let headerSocket = io();

interface StorageUser {
	username: string;
	token: string;
}
interface Conversation{
	withWho: string;
	unreadMsgs: number;
}
class Header {
	headerAuthDiv: HTMLElement = document.querySelector('#header-auth');
	noMessages = 0;

	init(){
		this.addHeaderAuth();
		this.getConversations();

		this.socketOnOnline();
		$('#dropDown').hide();
	}

	//sockets
	socketOnOnline = (): void =>{
		headerSocket.on('unread-cleared', (cleared: boolean)=>{
			if(cleared){
				console.log('worked');
				this.getConversations();
			}
		});
	}

	//eventListeners
	onClickMessage = (): void=>{
		if($('#dropDown').is(':hidden')){
			$('#dropDown').slideDown('slow');
		}else{
			$('#dropDown').slideUp('slow');
		}
		/*const list: HTMLElement = document.querySelector('#dropDown');
		if(this.noMessages > 0){
			list.classList.toggle('show-list');
		}*/
	}
    onLogout = (): void =>{
    	localStorage.removeItem('chatapp-user');
    	this.getIndexPage();
    	this.addHeaderAuth();
    }

	//dom
	addHeaderAuth = (): void=>{
		this.headerAuthDiv.innerHTML = '';
		if(this.userAvailable()){
			this.addMessageBtn();
			const userP = document.createElement('p');
			const logoutBtn = document.createElement('button');

			userP.innerText = this.getCurrentUser().username;
			logoutBtn.innerText = 'Logout';

			logoutBtn.addEventListener('click', this.onLogout.bind(this));

			this.headerAuthDiv.appendChild(userP);
			this.headerAuthDiv.appendChild(logoutBtn);
		}else{
			const signupLink = document.createElement('a');
			const loginLink = document.createElement('a');

			signupLink.setAttribute('href', "/auth/signup");
			loginLink.setAttribute('href', "/auth/login");

			signupLink.innerHTML = `<span>Signup</span>`;
			loginLink.innerHTML = `<span>Login</span>`;

			this.headerAuthDiv.appendChild(signupLink);
			this.headerAuthDiv.appendChild(loginLink);
		}		
	} 
	addMessageBtn = (): void =>{
		const msgDiv = document.createElement('div');
		msgDiv.innerHTML = '';
		msgDiv.classList.add('msgsDiv')
		msgDiv.innerHTML = `
			<p>Messages</p>
			<span id='no-of-msgs'></span>
			<div id='dropDown'>
				<ul id='dropDown-ul'></ul>
			</div>
		`;
		msgDiv.addEventListener('click', this.onClickMessage.bind(this))
		this.headerAuthDiv.appendChild(msgDiv);
	}
	addConvo = (convo: Conversation): void=>{
		const dropDownLi = document.createElement('li');
		dropDownLi.innerHTML = `<a href='/chatroom/${convo.withWho}'>${convo.withWho}(${convo.unreadMsgs})</a>`;
		const dropDownUl = document.querySelector('#dropDown-ul');
		dropDownUl.appendChild(dropDownLi);
	}
	setTotalMessages = (noMsgs: number): void=>{
		const noSpan = document.querySelector('#no-of-msgs');
		noSpan.innerHTML = `(${noMsgs})`;
	}

	//ajax	
	getConversations = (): void => {
		const username = this.getCurrentUser().username;
		$.get(`/api/active-conversations/${username}`)
		 .done((response)=>{
		 	const conversations: Conversation[] = response.data.conversations;
		 	if(conversations){
			 	conversations.forEach(convo=>{
			 		if(convo.unreadMsgs > 0){
				 		this.noMessages += convo.unreadMsgs;
						this.addConvo(convo);
			 		}
			 	});
			 	if(this.noMessages > 0){
				 	this.setTotalMessages(this.noMessages);
			 	}
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
	getIndexPage = (): void =>{
		window.location.href = '/';
	}
}

const header = new Header();
header.init();