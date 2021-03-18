//nothin cause it'll assume that its all on the same server alse put io(url)
let socket = io();

interface JQuery{
	tooltip(): void;
	popover(): void;
	magnificPopup(MagOptions): void;
}
interface StorageUser {
	username: string;
	token: string;
}
interface MagOptions {
	options: { [key: string]: string | undefined };
}
interface StorageUser {
	username: string;
	token: string;
}
interface Conversation{
	withWho: string;
	unreadMsgs: number;
}

class Index {
	noMessages = 0;
	withWhos = [];
	withWhosOnDisplay = [];
	chatroom: Messenger;

	mainDiv: HTMLElement = document.querySelector('#index-get-started');
	userNoExistDiv: HTMLElement = document.querySelector('#index-user-no-exist');
	newChatForm: HTMLFormElement = document.querySelector('#new-chat-form');
	newChatNameInput: HTMLInputElement = <HTMLInputElement>document.querySelector('#new-chat-name-input');
	newChatSubmitButton: HTMLElement = document.querySelector('#new-chat-submit-button');
	logoutButton = document.querySelector('.logout-btn');
	//scroll users online like instagram status
	activeUsersCarousel: JQuery<HTMLElement>;
	headerAuthDiv: HTMLElement = document.querySelector('#header-auth');
	

	init(){
		this.queryStarters();
		//this.setIndexMainDisplay();
		if(this.userAvailable()){
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
		}else{
			this.getLoginPage();
		}

		//used in only 3 places, the 3 buttons beside the input fielf for send message
		// @ts-ignore
		Waves.init();
	}

	//sockets
	socketOnOnline = (): void =>{
		socket.on('online', (onlineInfo: OnlineInfo)=>{
			this.withWhos.forEach((withWho)=>{
				if(onlineInfo.username === withWho){
					if(onlineInfo.online){
		 				if(!this.withWhosOnDisplay.includes(onlineInfo.username)){
			 				this.withWhosOnDisplay.push(onlineInfo.username);				 					
							this.addActiveUser(onlineInfo.username);
		 				}
					}else{
						const index = this.withWhosOnDisplay.indexOf(onlineInfo.username);
		 				if(index !== -1){
			 				this.withWhosOnDisplay.splice(index, 1);
							this.removeActiveUser(index);
		 				}
		 			}
				}				
			});
		});
	}
	socketOnClearUnread = (): void =>{
		socket.on('unread-cleared', (cleared: boolean)=>{
			if(cleared){
				//this.getConversations();
				this.getLatestMessages();
			}
		});
	}
	socketOnStatus = (): void =>{
		socket.on('status', (info: StatusInfo)=>{
			const registerSend: RegisterInfo = {
				username: this.getCurrentUser().username,
				socketId: info.id
			}
			socket.emit('register-id', registerSend);
		});
	}
	socketOnMsgSend = (): void =>{
		socket.on('send-msg', (msg: IMsg)=>{
			this.replaceUserChat(msg);
		});
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
		this.newChatSubmitButton.innerHTML = '';
		this.newChatSubmitButton && this.newChatSubmitButton.appendChild(itemLoaderDiv);
	}
	removeLoader = (): void =>{
		const itemLoaderDiv = document.querySelector('.Loader');
		this.newChatSubmitButton && this.newChatSubmitButton.removeChild(itemLoaderDiv);
		this.newChatSubmitButton.innerHTML = 'Start Chat';
	}
	addActiveUser = (username: string): void =>{
		//for online
		//<div class="avatar-xs mx-auto d-block chat-user-img online">
		//image
		//<img src="/images/users/avatar-2.jpg" alt="user-img" class="img-fluid rounded-circle">
		this.activeUsersCarousel.trigger('add.owl.carousel', [$(`
			<div class="item">
	            <span class="user-status-box" id="user-status-box-${username}" role="button">
	                <div class="avatar-xs mx-auto d-block chat-user-img away online">
	                    <span class="avatar-title rounded-circle bg-soft-primary text-primary">
	                        ${username.charAt(0).toUpperCase()}
	                    </span>
	                </div>
	                <span class="user-status"></span>
	                <h5 class="font-size-13 text-truncate mt-3 mb-1">${username}</h5>
	            </span>
            </div>
		`)]).trigger('refresh.owl.carousel');
		const newUser = document.querySelector(`#user-status-box-${username}`)
		newUser.addEventListener('click', this.onClickChat.bind(this, username));
		/*
		newUser.addEventListener('click', ()=>{
					$(".user-chat").addClass("user-chat-show");
				});
		*/
	}
	removeActiveUser = (index: number): void =>{
		//this.activeUsersCarousel.removeItem(index).trigger('refresh.owl.carousel');
		this.activeUsersCarousel.trigger('remove.owl.carousel', index).trigger('refresh.owl.carousel');
	}
	addUserChat = (msg: IMsg, timeToDisplay: string, position = 'append'): void=>{
		/**
		* online: <div class="chat-user-img online align-self-center me-3 ms-0">
		* offline: <div class="chat-user-img away align-self-center me-3 ms-0">
		* nothing: <div class="chat-user-img align-self-center me-3 ms-0">
		*/
		//<a href="#"></a>
		//status
        //<span class="user-status"></span>
		const receiver = (msg.receiver === this.getCurrentUser().username)? msg.sender: msg.receiver;
		const unread = (!msg.read && msg.sender !== this.getCurrentUser().username)? `
				<div class="unread-message">
                    <span class="badge badge-soft-danger rounded-pill">01</span>
                </div>`: ` `;
		const chatItem = document.createElement('li');
		chatItem.innerHTML = `
			<span class="chat-list-span" role="button">
                <div class="d-flex">                            
                    <div class="chat-user-img online align-self-center me-3 ms-0">
                        <div class="avatar-xs">
	                        <span class="avatar-title rounded-circle bg-soft-primary text-primary">
	                            ${receiver.charAt(0).toUpperCase()}
	                        </span>
	                    </div>
                    </div>
                    <div class="flex-1 overflow-hidden">
                        <h5 class="text-truncate font-size-15 mb-1">${receiver}</h5>
                        <p class="chat-user-message text-truncate mb-0">${msg.message}</p>
                    </div>
                    <div class="font-size-11">${timeToDisplay}</div>
                    ${unread}
                </div>
            </span>
		`;
		chatItem.addEventListener('click', this.onClickChat.bind(this, receiver));
		/*
		chatItem.addEventListener('click', ()=>{
			$(".user-chat").addClass("user-chat-show");
		});
		*/

		chatItem.dataset.userReceiver = `${msg.receiver}`;
		chatItem.dataset.userSender = `${msg.sender}`;
		const chatList = document.querySelector('.chat-list');
		if(position === 'append'){
			chatList.appendChild(chatItem);			
		}else if(position === 'prepend'){
			chatList.prepend(chatItem);;
		}
	}
	replaceUserChat = (msg: IMsg): void=>{
		this.removeUserChat(msg.sender, msg.receiver);
		msg.timeSent = this.changeDate(msg);
		this.addUserChat(msg, this.getUserChatTime(msg), 'prepend');
	}
	removeUserChat = (sender: string, receiver: string): void=>{
		const chatList = document.querySelector('.chat-list');
		const chatListChildren = chatList.children;
		for(let i = 0; i < chatListChildren.length; i++){
			if(chatListChildren[i].getAttribute('data-user-sender') === sender && 
				chatListChildren[i].getAttribute('data-user-receiver') === receiver || 
				chatListChildren[i].getAttribute('data-user-sender') === receiver && 
				chatListChildren[i].getAttribute('data-user-receiver') === sender){
				chatListChildren[i].remove();
			}
		}
	}
	setProfileDetails = (): void=>{
		const subNames = document.querySelectorAll('.profile-user-img');
		for(let i = 0; i < subNames.length; i++){
			subNames[i].innerHTML = this.getCurrentUser().username.charAt(0).toUpperCase();
		}
		const names = document.querySelectorAll('.profile-user-name');
		for(let i = 0; i < names.length; i++){
			names[i].innerHTML = this.getCurrentUser().username;
		}
	}
	setWelcomePackage = (): void=>{
		const testMsg: IMsg = {
			sender: 'Lenzo',
			receiver: 'Welcome',
			_id: 0,
			read: false,
			message: 'Welcome to my chatapp, Click me!!',
			timeSent: new Date(Date.now())
		}
		this.addUserChat(testMsg, this.getTimeOnly(testMsg.timeSent));		
	}
	queryStarters = (): void=>{
		$(".dropdown-menu a.dropdown-toggle").on("click",function(t){
			return $(this).next().hasClass("show")
				||
				$(this).parents(".dropdown-menu")
						.first()
						.find(".show")
						.removeClass("show"),
				$(this).next(".dropdown-menu")
						.toggleClass("show"),
				!1
		});
		$(function(){
			//tooltip for displaying the title of whatever is hovered on
			$('[data-toggle="tooltip"]').tooltip()
		});
		$(function(){
			$('[data-toggle="popover"]').popover()
		});
		$("#light-dark").on("click",function(t){
			"disabled" !== $("#bootstrap-style").attr("disabled")
				?
				(
					$("#bootstrap-dark-style").prop("disabled", false),
					$("#bootstrap-style").prop("disabled", true),
					$("#app-dark-style").prop("disabled", false),
					$("#app-style").prop("disabled", true)
				)
				:
				(
					$("#bootstrap-dark-style").prop("disabled", true),
					$("#bootstrap-style").prop("disabled", false),
					$("#app-dark-style").prop("disabled", true),
					$("#app-style").prop("disabled", false)
				)
		});
		//magnify image to see in full screen
		$(".popup-img").magnificPopup({
			type:"image",
			closeOnContentClick: true,
			mainClass:"mfp-img-mobile",
			image:{
				verticalFit: true
			}
		});
		this.activeUsersCarousel = $("#user-status-carousel").owlCarousel({
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
				0: { items:2 },
				600: {
					items:5,
					nav: false
				},
				992: { items:8 }
			}
		});
		$("#user-profile-hide").click(function(){
			//to close the user profile sidebar, if its opened it'll hide it
			$(".user-profile-sidebar").hide();
			document.querySelector('.chat-input-section').classList.add('fixed-bottom');
		});
		$(".user-profile-show").click(function(){
			//show user profile sidebar
			$(".user-profile-sidebar").show();
			document.querySelector('.chat-input-section').classList.remove('fixed-bottom');
		});
		$(".chat-user-list li a").click(function(){
			//show chat
			$(".user-chat").addClass("user-chat-show")
		});
		$(".user-chat-remove").click(()=>{
			this.chatroom.socketOnDisconnect();
			//in mobile view remove user chats
			$(".user-chat").removeClass("user-chat-show")
		});
		const toggle = (e: MediaQueryListEvent | MediaQueryList, type: string)=>{
			if(e.matches){
				if(type === 'add'){
					document.querySelector('.chat-input-section').classList.add('fixed-bottom');
				}else if(type === 'remove'){
					document.querySelector('.chat-input-section').classList.remove('fixed-bottom');
				}else{
					document.querySelector('.chat-input-section').classList.toggle('fixed-bottom');					
				}
			}
		}
		const mediaQueryGoesAbove = window.matchMedia('(min-width: 992px)');
		const mediaQueryGoesBelow = window.matchMedia('(max-width: 992px)');
		toggle(mediaQueryGoesAbove, 'remove');
		toggle(mediaQueryGoesBelow, 'add');
		mediaQueryGoesAbove.addListener((e)=>{
			toggle(e, 'remove');
		});
		mediaQueryGoesBelow.addListener((e)=>{
			toggle(e, 'add');
		});
	}
	//header
	addHeaderAuth = (): void=>{
		if(this.headerAuthDiv){
			this.headerAuthDiv.innerHTML = '';
		}
		if(this.userAvailable()){
			this.addMessageBtn();
			const userP = document.createElement('p');
			const logoutBtn = document.createElement('button');

			userP.innerText = this.getCurrentUser().username;
			logoutBtn.innerText = 'Logout';

			logoutBtn.addEventListener('click', this.onLogout.bind(this));

			this.headerAuthDiv && this.headerAuthDiv.appendChild(userP);
			this.headerAuthDiv && this.headerAuthDiv.appendChild(logoutBtn);
		}else{
			const signupLink = document.createElement('a');
			const loginLink = document.createElement('a');

			signupLink.setAttribute('href', "/auth/signup");
			loginLink.setAttribute('href', "/auth/login");

			signupLink.innerHTML = `<span>Signup</span>`;
			loginLink.innerHTML = `<span>Login</span>`;

			this.headerAuthDiv && this.headerAuthDiv.appendChild(signupLink);
			this.headerAuthDiv && this.headerAuthDiv.appendChild(loginLink);
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
		this.headerAuthDiv && this.headerAuthDiv.appendChild(msgDiv);
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

	//eventListeners
	onSubmitForm = (): void=>{
		this.newChatForm.addEventListener('submit', (e)=>{
			e.preventDefault();
			this.showLoader();
			if(this.newChatNameInput && this.newChatNameInput.value){
				//socket.emit('message', this.newChatNameInput.value);
				this.chatroomRequest(this.newChatNameInput.value);
				this.removeLoader();
			}
		});
	}
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
		this.logoutButton.addEventListener('click', ()=>{
	    	localStorage.removeItem('chatapp-user');
	    	this.getLoginPage();
	    	this.addHeaderAuth();
		});
    }
    onClickChat = (username: string): void=>{
		this.chatroom && this.chatroom.socketOnDisconnect();
		this.chatroom = new Messenger(username);
		this.chatroom.init();
		$(".user-chat").addClass("user-chat-show");
    }

	//ajax
	chatroomRequest = (username: string): void=>{
		$.get(`/auth/exist/${username}`)
		 .done(response=>{
			const closeBtn = <HTMLButtonElement>document.querySelector('.btn-close');
			if(response.data.status){
				this.onClickChat(this.newChatNameInput.value);
				closeBtn.click();
				this.newChatNameInput.value = '';
				//this.getChatRoomPage(username);
			}else{
				console.log('no exist');
				//<button type="button" class="btn btn-link text-decoration-none text-muted font-size-18 py-0" data-bs-toggle="modal" data-bs-target="#addChat">
				const addModalBtn = document.createElement('button');
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
		 		let withWhos = [];
			 	conversations.forEach(convo=>{
			 		this.getUserStatus(convo.withWho)
				 		.done(response=>{
				 			if(response.data.status){
				 				if(!this.withWhosOnDisplay.includes(convo.withWho)){
					 				this.addActiveUser(convo.withWho);
					 				this.withWhosOnDisplay.push(convo.withWho);				 					
				 				}
				 			}
						})
						.fail(err=>{
							console.log(err);
						});
					withWhos.push(convo.withWho);
			 	});
			 	this.withWhos = withWhos;
		 	}
		 }).fail(err=>{
		 	console.log(err);
		 });
	}
	getLatestMessages = (): void =>{
		const username = this.getCurrentUser().username;
		$.get(`/api/messages/recent/${username}`)
		 .done((response)=>{
		 	//next to do sort by time and display time or date
		 	const msgs: IMsg[] = response.data.messages;
		 	if(msgs.length > 0){
			 	msgs.sort((a, b)=>{
			 		const aa = new Date(a.timeSent);
			 		const bb = new Date(b.timeSent);
			 		return (bb.valueOf() - aa.valueOf());
			 	});
		 		msgs.forEach((msg)=>{
		 			//create api endpoint to check unread messages;
		 			msg.timeSent = this.changeDate(msg);
		 			this.addUserChat(msg, this.getUserChatTime(msg));
		 		});
		 		//this.setWelcomePackage();
		 	}else{
		 		this.setWelcomePackage();
		 	}
		 }).fail(err=>{
		 	console.log(err);
		 });
	}	
	//header
	getHeaderConversations = (): void => {
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
	getUserStatus = (username: string): JQueryPromise<any> =>{
		return $.get(`/auth/status/${username}`);		 
	}

	//utils
	changeDate = (msg: IMsg): Date =>{ return new Date(msg.timeSent); }
	getTimeOnly = (dateObj: Date): string =>{ 
		return `
			${dateObj.getHours()}:${(dateObj.getMinutes()<10)? 
				'0' + dateObj.getMinutes(): dateObj.getMinutes()}
		`; 
	}
	getUserChatTime = (msg: IMsg): string=>{
		let today  = new Date().toDateString().substr(4);
		let timeToDisplay = '';
		if(today !== msg.timeSent.toDateString().substr(4)){
			timeToDisplay = msg.timeSent.toDateString().substr(4);
		}else{
			timeToDisplay = this.getTimeOnly(msg.timeSent);
		}
		return timeToDisplay;		
	}
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
	//header
	getIndexPage = (): void =>{
		window.location.href = '/';
	}
	getLoginPage = (): void =>{
		window.location.href = '/auth/login';
	}
}

const index = new Index();
index.init();