//nothin cause it'll assume that its all on the same server alse put io(url)
let socket = io();

interface JQuery{
	tooltip(): void;
	popover(): void;
	magnificPopup(MagOptions): void;
	modal(
		setting?: string,
		options?: { [key: string]: string | undefined }
	): void;
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
interface Group{
	name: string;
	description: string;
	users: { username: string }[];
	creator: string;
	admins: { username: string }[];
}

class Index {
	noMessages = 0;
	withWhos = [];
	withWhosOnDisplay = [];
	groups: Group[] = [];
	chatroom: Messenger;
	groupchatroom: GroupMessenger;

	newChatForm: HTMLFormElement = document.querySelector('#new-chat-form');
	newChatNameInput: HTMLInputElement = <HTMLInputElement>document.querySelector('#new-chat-name-input');
	newChatSubmitButton: HTMLElement = document.querySelector('#new-chat-submit-button');

	newGroupForm: HTMLFormElement = document.querySelector('#new-group-form');
	newGroupNameInput: HTMLInputElement = <HTMLInputElement>document.querySelector('#new-group-name-input');
	newGroupDescriptionInput: HTMLInputElement = <HTMLInputElement>document.querySelector('#new-group-description-input');
	newGroupSubmitButton: HTMLElement = document.querySelector('#new-group-submit-button');

	logoutButton = document.querySelectorAll('.logout-btn');
	searchChatsInput: HTMLInputElement = document.querySelector('.search-chats');
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

			this.onNewChatSubmitForm();
			this.onNewGroupSubmitForm();
			this.onSearchChats();
			this.onCloseSearch();

			this.getGroupsUserBelogsTo();
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
	showNewChatLoader = (): void =>{
		const itemLoaderDiv = document.createElement('div');
		itemLoaderDiv.classList.add('Loader');
		this.newChatSubmitButton.innerHTML = '';
		this.newChatSubmitButton.appendChild(itemLoaderDiv);
	}
	showNewGroupLoader = (): void =>{
		const itemLoaderDiv = document.createElement('div');
		itemLoaderDiv.classList.add('Loader', 'new-group-loader');
		this.newGroupSubmitButton.innerHTML = '';
		this.newGroupSubmitButton.appendChild(itemLoaderDiv);
	}
	removeNewChatLoader = (): void =>{
		const itemLoaderDiv = document.querySelector('.Loader');
		this.newChatSubmitButton && this.newChatSubmitButton.removeChild(itemLoaderDiv);
		this.newChatSubmitButton.innerHTML = 'Start Chat';
	}
	removeNewGroupLoader = (): void =>{
		const itemLoaderDiv = document.querySelector('.new-group-loader');
		this.newGroupSubmitButton && this.newGroupSubmitButton.removeChild(itemLoaderDiv);
		this.newGroupSubmitButton.innerHTML = 'Create Groups';
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
	setContacts = (withWhos: string[])=>{
		const sorted = [...withWhos];
		sorted.sort();
		let letter = '';
		sorted.forEach((withWho: string)=>{
	        let aGroup = false;
	        this.groups.forEach(group=>{
	        	if(group.name === withWho){ aGroup = true; }
	        });

			const localLetter = withWho.charAt(0).toUpperCase();
			if(localLetter !== letter){
				letter = localLetter;
				!aGroup && this.addGroupTag(letter);
			}
	        if(!aGroup){
				this.addContact(withWho);
				this.addNewGroupContact(withWho);	        	
	        }
		});
	}
	addGroupTag = (tag: string): void=>{
		const tagItem = document.createElement('div');
		tagItem.classList.add('p-3', 'fw-bold', 'text-primary');
		tagItem.innerHTML = `${tag}`;
		document.querySelector('.contact-list').appendChild(tagItem);
		//document.querySelector('.new-group-contact-list').appendChild(tagItem);
	}
	addContact = (username: string)=>{
        let aGroup = false;
        this.groups.forEach(group=>{
        	if(group.name === username){ aGroup = true; }
        });
		const contactItem = document.createElement('li');
		contactItem.innerHTML = `
			<div class="d-flex align-items-center">
                <div class="flex-1">
                    <h5 class="font-size-14 m-0">${username}</h5>
                </div>
                <div class="dropdown">
                    <a href="#" class="text-muted dropdown-toggle" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        <i class="ri-more-2-fill"></i>
                    </a>
                    <div class="dropdown-menu dropdown-menu-end">
                        <a class="dropdown-item" href="#">Share <i class="ri-share-line float-end text-muted"></i></a>
                        <a class="dropdown-item" href="#">Block <i class="ri-forbid-line float-end text-muted"></i></a>
                        <a class="dropdown-item" href="#">Remove <i class="ri-delete-bin-line float-end text-muted"></i></a>
                    </div>
                </div>
            </div>
		`;
		contactItem.addEventListener('click', this.onClickChat.bind(this, username));
		if(!aGroup){
			document.querySelector('.contact-list').appendChild(contactItem);			
		}
	}
	setGroups = (groups: Group[]): void=>{
		groups.forEach(group=>{
			this.addGroup(group);
		});
	}
	addGroup = (group: Group): void=>{
		const item = document.createElement('li');
		//unread
		//<span class="badge badge-soft-danger rounded-pill float-end">New</span>
		item.innerHTML = `
			<span class="group-list-span" role="button">
                <div class="d-flex align-items-center">
                    <div class="chat-user-img me-3 ms-0">
                        <div class="avatar-xs">
                            <span class="avatar-title rounded-circle bg-soft-primary text-primary">
                                ${group.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    </div>
                    <div class="flex-1 overflow-hidden">
                        <h5 class="text-truncate font-size-14 mb-0">
	                        #${group.name}
	                    </h5>
                    </div>
                </div>
            </span>
		`;
		item.addEventListener('click', this.onClickGroup.bind(this, group.name));
		item.dataset.groupname = group.name;
		document.querySelector('.group-list').appendChild(item);
	}
	addNewGroupContact = (username: string)=>{
		//checked
		const newGroupContactItem = document.createElement('li');
		newGroupContactItem.innerHTML = `
			<div class="form-check">
                <input type="checkbox" class="form-check-input" id="new-group-check-${username}">
                <label class="form-check-label" for="new-group-check-${username}">${username}</label>
            </div>
		`;
		const addUserContactItem = document.createElement('li');
		addUserContactItem.innerHTML = `
			<div class="form-check">
                <input type="checkbox" class="form-check-input" id="add-user-group-check-${username}">
                <label class="form-check-label" for="add-user-group-check-${username}">${username}</label>
            </div>
		`;
		//contactItem.addEventListener('click', this.onClickChat.bind(this, username));
		document.querySelector('.new-group-contact-list').appendChild(newGroupContactItem);
		document.querySelector('.add-user-group-contact-list').appendChild(addUserContactItem);
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
        let aGroup = false;
        this.groups.forEach(group=>{
        	if(group.name === msg.receiver || group.name === msg.sender){ aGroup = true; }
        });
		const receiver = (msg.receiver === this.getCurrentUser().username)? msg.sender: msg.receiver;
		const unread = (!msg.read && msg.sender !== this.getCurrentUser().username)? `
				<div class="unread-message">
                    <span class="badge badge-soft-danger rounded-pill">New</span>
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
		if(!aGroup){
			const chatList = document.querySelector('.chat-list');
			if(position === 'append'){
				chatList.appendChild(chatItem);
			}else if(position === 'prepend'){
				chatList.prepend(chatItem);;
			}
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
	setActiveUserChat = (username: string): void=>{
		const chatList = document.querySelector('.chat-list');
		const chatListChildren = chatList.children;
		for(let i = 0; i < chatListChildren.length; i++){
			chatListChildren[i].classList.remove('active');
			if(chatListChildren[i].getAttribute('data-user-sender') === username || 
				chatListChildren[i].getAttribute('data-user-receiver') === username || 
				chatListChildren[i].getAttribute('data-user-sender') === username || 
				chatListChildren[i].getAttribute('data-user-receiver') === username){
				chatListChildren[i].classList.add('active');
			}
		}
	}
	setActiveGroupChat = (username: string): void=>{
		const groupList = document.querySelector('.group-list');
		const groupListChildren = groupList.children;
		for(let i = 0; i < groupListChildren.length; i++){
			groupListChildren[i].classList.remove('active');
			if(groupListChildren[i].getAttribute('data-groupname') === username){
				groupListChildren[i].classList.add('active');
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
		document.querySelector('.profile-user-time-online').innerHTML = `${this.getTimeOnly(new Date())}`;
		this.getAttachmentMessages();
	}
	addFileAttachmentsProfile = (attachMsg: IMsg): void=>{
		const cardInnerDivSubThree = document.createElement('div');
        cardInnerDivSubThree.classList.add('ms-4', 'me-0', 'btn');
        cardInnerDivSubThree.innerHTML = `
        	<span>
                <i class="ri-download-2-line"></i>
            </span>
        `;
        cardInnerDivSubThree.addEventListener('click', ()=>{
        	this.getFIle(this.updateFileURL(attachMsg.fileURL), attachMsg.message);
        });

        const cardInnerDivSubTwo = document.createElement('div');
        cardInnerDivSubTwo.classList.add('flex-1');
        cardInnerDivSubTwo.innerHTML = `
	        <div class="text-start">
                <h5 class="font-size-14 mb-1 text-truncate">${attachMsg.message}</h5>
                <p class="text-muted font-size-13 mb-0">${this.formatBytes(attachMsg.fileSize)}</p>
            </div>
        `;

        const cardInnerDivSubOne = document.createElement('div');
        cardInnerDivSubOne.classList.add('avatar-sm', 'me-3', 'ms-0');
        cardInnerDivSubOne.innerHTML = `
        	<div class="avatar-title bg-soft-primary text-primary rounded font-size-20">
                ${(attachMsg.typeOfMsg === MsgTypeEnum.img)? '<i class="ri-image-fill"></i>': '<i class="ri-file-text-fill"></i>'}
            </div>
        `;
        
        const cardInnerDiv = document.createElement('li');
        cardInnerDiv.classList.add('d-flex', 'align-items-center');
        cardInnerDiv.appendChild(cardInnerDivSubOne);
        cardInnerDiv.appendChild(cardInnerDivSubTwo);
        cardInnerDiv.appendChild(cardInnerDivSubThree);

        const card = document.createElement('ul');
        card.classList.add('card', 'p-2', 'mb-2');
        card.appendChild(cardInnerDiv);

		//ctext-wrap-content
		const item = document.createElement('div');
		item.classList.add('ctext-wrap-content');
        item.insertAdjacentElement('afterbegin', card);
        document.querySelector('.profile-attached-files').appendChild(item);
	}
	setWelcomePackage = (): void=>{
		const testMsg: IMsg = {
			sender: 'Lenzo',
			receiver: 'Welcome',
			_id: 0,
			read: false,
			message: 'Welcome to my chatapp, Click me!!',
			timeSent: new Date(Date.now()),
			typeOfMsg: MsgTypeEnum.text
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
			toggle(mediaQueryGoesBelow, 'add');
		});
		$(".user-profile-show").click(function(){
			//show user profile sidebar
			$(".user-profile-sidebar").show();
			toggle(mediaQueryGoesBelow, 'remove');
		});
		$(".chat-user-list li a").click(function(){
			//show chat
			$(".user-chat").addClass("user-chat-show")
		});
		$(".user-chat-remove").click(()=>{
			this.chatroom && this.chatroom.socketOnDisconnect();
			this.groupchatroom && this.groupchatroom.socketOnDisconnect();
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
	onNewChatSubmitForm = (): void=>{
		this.newChatForm.addEventListener('submit', (e)=>{
			e.preventDefault();
			this.showNewChatLoader();
			if(this.newChatNameInput && this.newChatNameInput.value){
				//socket.emit('message', this.newChatNameInput.value);
				this.chatroomRequest(this.newChatNameInput.value.toLowerCase());
				this.removeNewChatLoader();
			}
		});
	}
	onNewGroupSubmitForm = (): void=>{
		this.newGroupForm.addEventListener('submit', (e)=>{
			e.preventDefault();
			this.showNewGroupLoader();
			if(this.newGroupNameInput && this.newGroupNameInput.value){
				const data = {
					name: this.newGroupNameInput.value,
					creator: this.getCurrentUser().username,
					description: this.newGroupDescriptionInput.value,
				};
				this.createNewGroup(data);
				$('#addgroup').modal('hide');
				this.removeNewGroupLoader();
			}
		});
	}
	onSearchChats = (): void=>{
		this.searchChatsInput && this.searchChatsInput.addEventListener('input', (e)=>{
			const closeSearch = document.querySelector('.close-search');
			if(this.searchChatsInput.value.length !== 0){
				document.querySelector('.recent-header').innerHTML = 'Search Result';
				closeSearch.classList.remove('d-none');
				closeSearch.innerHTML = `
					<div class="spinner-border" role="status"></div>
				`;
				let searchResult = this.withWhos.filter((withWho: string)=>{
					return withWho.includes(this.searchChatsInput.value);
				});
				document.querySelector('.chat-list').innerHTML = ``;
				this.getLatestMessagesSearch(searchResult);
            } else {
				closeSearch.classList.add('d-none');
            }
		});
	}
	onCloseSearch = (): void=>{
		const closeSearch = document.querySelector('.close-search');
        closeSearch.addEventListener('click', ()=>{
        	document.querySelector('.recent-header').innerHTML = 'Recent';
        	this.searchChatsInput.value = '';
			closeSearch.classList.add('d-none');
			document.querySelector('.chat-list').innerHTML = ``;
			this.getLatestMessages();
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
		this.logoutButton.forEach(btn=>{
			btn.addEventListener('click', ()=>{
		    	localStorage.removeItem('chatapp-user');
		    	this.getLoginPage();
		    	this.addHeaderAuth();
			});
		});
    }
    onClickChat = (username: string): void=>{
		this.chatroom && this.chatroom.socketOnDisconnect();
		this.chatroom = new Messenger(username);
		this.chatroom.init();
		this.setActiveUserChat(username);
		$(".user-chat").addClass("user-chat-show");
    }
    onClickGroup = (groupname: string): void=>{
		this.groupchatroom && this.groupchatroom.socketOnDisconnect();
		this.groupchatroom = new GroupMessenger(groupname);
		this.groupchatroom.init();
		this.setActiveGroupChat(groupname);
		$(".user-chat").addClass("user-chat-show");
    }

	//ajax
	chatroomRequest = (username: string): void=>{
		$.get(`/auth/exist/${username}`)
		 .done(response=>{
			const closeBtn = <HTMLButtonElement>document.querySelector('.btn-close');
			if(response.data.status){
				this.onClickChat(username);
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
	createNewGroup = (data): void=>{
		$.post('/api/group/new', data)
		 .done(response=>{
		 	const group: Group = response.data.group;
		 	if(response.data.success){
				const formEle = this.newGroupForm.elements;
				for(let i = 0; i < formEle.length; i++){
					if((formEle[i] as HTMLInputElement).checked){
						this.addUserToGroup(group.name, formEle[i].nextElementSibling.innerHTML);
					}
				}
		 	}
		 })
		 .fail(err=>{
		 	console.log(err);
		 });
	}
	addUserToGroup = (groupname: string, username: string): void=>{
		$.post(`/api/group/add-user/${groupname}`, { username: username })
		 .done(response=>{
		 	console.log(response);
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
		 		let withWhos: string[] = [];
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
			 	this.setContacts(withWhos);
			 	this.withWhos = withWhos;
		 	}
		 }).fail(err=>{
		 	console.log(err);
		 });
	}
	getLatestMessagesSearch = (searchWithWhos: string[]): void => {
		const username = this.getCurrentUser().username;
		$.get(`/api/messages/recent/${username}`)
		 .done((response)=>{
		 	const msgs: IMsg[] = response.data.messages;
		 	if(msgs.length > 0){
			 	msgs.sort((a, b)=>{
			 		const aa = new Date(a.timeSent);
			 		const bb = new Date(b.timeSent);
			 		return (bb.valueOf() - aa.valueOf());
			 	});
		 		msgs.forEach((msg)=>{
		 			//create api endpoint to check unread messages;
			 		if(searchWithWhos.includes(msg.sender) || searchWithWhos.includes(msg.receiver)){
			 			msg.timeSent = this.changeDate(msg);
			 			this.addUserChat(msg, this.getUserChatTime(msg));			 			
			 		}
		 		});
		 		document.querySelector('.close-search').innerHTML = `
		 			<button type="button" class="btn-close" aria-label="Close"></button>
		 		`;
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
	getAttachmentMessages = (): void=>{
		const { username } = this.getCurrentUser();
		$.get(`/api/messages/attachment/${username}`)
		 .done(response=>{
		 	const messages: IMsg[] = response.data.messages;
		 	if(messages){
		 		messages.forEach(msg=>{
					msg.timeSent = this.changeDate(msg);
		 			this.addFileAttachmentsProfile(msg);
		 		});
		 	}
		 })
		 .fail(err=>{
		 	console.log(err);
		 });
	}
	getGroupsUserBelogsTo = (): void=>{
		const { username } = this.getCurrentUser();
		$.get(`/api/groups/${username}`)
		 .done(response=>{
		 	const groups: Group[] = response.data.groups;
		 	this.setGroups(groups);
		 	this.groups = groups;
		 })
		 .fail(err=>{
		 	console.log(err);
		 })
	}
	getFIle = (url: string, filename: string): void=>{
		$.ajax({
			url: url,
			xhrFields: {
				responseType: 'blob'
			},
			success: (response)=>{
	        	//@ts-ignore
				fileDownload(response, filename);
			},
			error: ()=>{}
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
	updateFileURL(fileURL: string){
		if(window.location.origin === 'http://localhost:8080' || window.location.origin === 'http://192.168.43.240:8080'){
			return 'api/' + fileURL;
		}
		return fileURL;
	}
	formatBytes = (bytes, decimals = 2): string =>{
	    if (bytes === 0) return '0 Bytes';

	    const k = 1024;
	    const dm = decimals < 0 ? 0 : decimals;
	    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

	    const i = Math.floor(Math.log(bytes) / Math.log(k));

	    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
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