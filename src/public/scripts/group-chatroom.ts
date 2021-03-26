const enum groupMessengerProps {
	messages = 'messages',
	form = 'form',
	msgInput = 'msgInput',
	groupOnlineDot = 'groupOnlineDot'
};
interface RegisterGroupMessenger extends RegisterInfo{
	groupname: string
}
class GroupMessenger{
	socket = io();
	lastDate = '';
	messageData: { [key: string]: string};
	groupDetails: Group;

	groupProfileImgSmall: HTMLElement = document.querySelector('.chat-user-avatar-container-small');
	groupProfileImgBig: HTMLElement = document.querySelector('.chat-user-avatar-container-big');
	groupProfileName: NodeListOf<HTMLElement> = document.querySelectorAll('.chat-user-name');
	groupOnlineDot: NodeListOf<HTMLElement> = document.querySelectorAll('.chat-user-online-dot');
	addUserToGroupForm: HTMLFormElement = document.querySelector('#add-user-group-form');
	addUserGroupSubmitButton: HTMLElement = document.querySelector('#add-user-submit-button');

	messages: HTMLElement = document.querySelector('#chatroom-messages');
	msgInput: HTMLInputElement = <HTMLInputElement>document.querySelector('#chatroom-msg');
	form: Element = document.querySelector('#chatroom-form');
	emojiBtn: HTMLElement = document.querySelector('.emoji-btn');
	attachBtn: HTMLInputElement = document.querySelector('#chat-input-file');
	fileForm: Element = document.querySelector('#send-file-form');

	// @ts-ignore
	picker = new FgEmojiPicker({
		trigger: ['.emoji-btn'],
		position: ['top', 'left'],
		dir: '/libs/vanilla-javascript-emoji-picker/',
		preFetch: true,
		insertInto: this.msgInput,
		emit(ogj, triggerElement){ }
	});

	constructor(public groupname: string){}
	setMessageData = (): void =>{
		this.messageData = {
			msg: this.msgInput && this.msgInput.value,
			sender: this.getCurrentUser().username,
			receiver: this.groupname
		}
	}
	resetDOMs = (groupMessengerPropsToReset: string): void =>{
		switch (groupMessengerPropsToReset) {
			case groupMessengerProps.messages:
				this[groupMessengerProps.messages] = document.querySelector('#chatroom-messages');
				break;
			case groupMessengerProps.form:
				this[groupMessengerProps.form] = document.querySelector('#chatroom-form');
				break;
			case groupMessengerProps.msgInput:
				this[groupMessengerProps.msgInput] = <HTMLInputElement>document.querySelector('#chatroom-msg');
				break;
			case groupMessengerProps.groupOnlineDot:
				//this[groupMessengerProps.groupOnlineDot] = document.querySelector('.user-online-dot');
				break;
			default:
				break;
		}
	}

	init = (): void => {
		this.setMessageData();
		this.getGroupDetails();
		if(!this.userAvailable()){
			this.getLoginPage();
		}				
		if(this.messages){
			this.messages.innerHTML = 'Loading.....';
		}
		if(this.groupname !== 'Welcome'){
			//initialize sockets
			this.socketOnStatus();
			this.socketOnMsgSend();
			this.socketOnMsgDelete();
			this.socketOnReceiveTyping();

			this.getAttachmentMessages(this.groupname);
			this.getGroupMessage();			

			this.onAddSendTextMessage();
			this.onAddSendFileMessage();
			this.onAddUserGroupSubmitForm();
			this.onTypingRelated();
			this.onAttchBtnClick();
			//this.onEmojiKeyboardInit();
		}
	}

	//sockets
	socketOnStatus = (): void =>{
		this.socket.on('status', (info: StatusInfo)=>{
			this.setStatus(this.groupname);
			this.setMessageData();
			const registerSend: RegisterGroupMessenger = {
				username: this.messageData.sender,
				groupname: this.messageData.receiver,
				socketId: info.id
			}
			this.clearUnreadMsg();
			this.socket.emit('register-grouproom', registerSend);
		});
	}
	socketOnMsgSend = (): void =>{
		this.socket.on('send-msg', (msg: IMsg)=>{
			msg.timeSent = this.changeDate(msg);
			if(!this.lastDate || this.lastDate !== msg.timeSent.toDateString().substr(4)){
				this.displayMsgsDate('Today');
				this.lastDate = msg.timeSent.toLocaleDateString();
			}
			this.addMessage(msg);
		});
	}
	socketOnMsgDelete = (): void =>{
		//add feature
		//subtly remove delete element
		this.socket.on('delete-msg', (data)=>{
			this.removeMessage(data.msgDeleted._id);
		});
	}
	socketOnDisconnect =(): void=>{ 
		this.socket.emit('grouproom-disconnect');
		document.querySelector('.group-description').innerHTML = `Hi, I'm available`;
		this.onRemoveSendTextMessage();
		this.onRemoveSendFileMessage();
		this.onTypingRelatedRemove();
	}
	socketOnSendTyping = (typing: boolean): void=>{
		this.socket.emit('typing', { 
			usernames: {
				sender: this.messageData.sender,
				receiver: this.messageData.receiver
			},
			typing: typing
		});
	}
	socketOnReceiveTyping = (): void=>{
		this.socket.on('io-typing', (userData: Typings)=>{
			if(userData.usernames.receiver === this.messageData.sender){
				if(userData.typing){
					this.addTyping(userData.usernames.sender);
				}else{
					this.removeTyping();
				}
			}
		});
	}
	socketOnClearUnread = (): void =>{
		socket.on('unread-cleared', (cleared: boolean)=>{
			if(cleared){
				//set message to read on display
			}
		});
	}

	//DOM changers
	addMessage = (msgObj: IMsg): void => {
		switch (msgObj.typeOfMsg) {
			case MsgTypeEnum.text:
				this.addTextMessage(msgObj);
				break;
			case MsgTypeEnum.img:
				this.addImgMessage(msgObj);
				break;
			case MsgTypeEnum.otherfile:
				this.addOtherFileMessage(msgObj);
				break;
			default:
				this.addTextMessage(msgObj);
				break;
		}
	}
	addTextMessage = (msgObj: IMsg): void=>{
		`		
            <item>
                <itemMainDiv>
                    //<itemAvatarDiv />

                    <itemContentDiv>
                        <itemContentWrapperDiv>
                            <itemContentWrapperDivOne />

                            <itemContentWrapperDivTwo>
                                --inserted

                                <itemDropDowmMenu>
                                    <dropdowmFrag />
                                </itemDropDowmMenu>
                            </itemContentWrapperDivTwo>
                        </itemContentWrapperDiv>

                        //<itemName />
                    </itemContentDiv>
                </itemMainDiv>
            </item>
		`;
		//conversation-name
		const itemName = document.createElement('div');
		itemName.classList.add('conversation-name');
		itemName.innerHTML = `${msgObj.sender}`;

		const dropdowmFrag = new DocumentFragment();
		const dropdownData = [
			{ text: 'Copy', iconClass: 'file-copy' },
			{ text: 'Save', iconClass: 'save' },
			{ text: 'Forward', iconClass: 'chat-forward' },
			{ text: 'Delete', iconClass: 'delete-bin' }
		];
		dropdownData.forEach(data=>{
			const dropdownItem = document.createElement('span');
			dropdownItem.addEventListener('click', this.onMessageCollection.bind(this, data.text, { id: msgObj._id, text: data.text }));
			//dropdownItem.addEventListener('click', this.deleteMessage.bind(this, msgObj._id));
			dropdownItem.setAttribute('role', 'button');
			dropdownItem.classList.add('dropdown-item');
			dropdownItem.innerHTML = `
            	${data.text}
            	<i class="ri-${data.iconClass}-line float-end text-muted"></i>
			`;
			dropdowmFrag.appendChild(dropdownItem);
		});

		//dropdown-menu
		const itemDropDowmMenu = document.createElement('div');
		itemDropDowmMenu.classList.add('dropdown-menu');
		itemDropDowmMenu.appendChild(dropdowmFrag);

		//dropdown
		const itemContentWrapperDivTwo = document.createElement('div');
		itemContentWrapperDivTwo.classList.add('dropdown', 'align-self-start');
		itemContentWrapperDivTwo.insertAdjacentHTML(
			'afterbegin',
			`<span class="dropdown-toggle dropdown-click invisible" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <i class="ri-more-2-fill"></i>
            </span>`
        );
        itemContentWrapperDivTwo.insertAdjacentElement('beforeend', itemDropDowmMenu);

		//ctext-wrap-content
		const itemContentWrapperDivOne = document.createElement('div');
		itemContentWrapperDivOne.classList.add('ctext-wrap-content')
		itemContentWrapperDivOne.innerHTML = `
            <p class="mb-0">
                ${msgObj.message}
            </p>
            <p class="chat-time mb-0"><i class="ri-time-line align-middle"></i> <span class="align-middle">${this.getTimeOnly(msgObj.timeSent)}</span></p>			
		`;

		//ctext-wrap
		const itemContentWrapperDiv = document.createElement('div');
		itemContentWrapperDiv.classList.add('ctext-wrap');
		itemContentWrapperDiv.appendChild(itemContentWrapperDivOne);
		itemContentWrapperDiv.appendChild(itemContentWrapperDivTwo);

		//user-chat-content
		const itemContentDiv = document.createElement('div');
		itemContentDiv.classList.add('user-chat-content');
		itemContentDiv.appendChild(itemContentWrapperDiv);
		itemContentDiv.appendChild(itemName);

		//chat-avatar
		const itemAvatarDiv = document.createElement('div');
		itemAvatarDiv.classList.add('chat-avatar');
		itemAvatarDiv.innerHTML = `
        <span class="avatar-title rounded-circle bg-soft-primary text-primary">
            ${msgObj.sender.charAt(0).toUpperCase()}
        </span>
		`;

		//conversation-list
		const itemMainDiv = document.createElement('div');
		itemMainDiv.classList.add('conversation-list');
		itemMainDiv.appendChild(itemAvatarDiv);
		itemMainDiv.appendChild(itemContentDiv);		

		const item = document.createElement('li');

		item.addEventListener('mouseover', this.onHoverMessage.bind(this));
		item.addEventListener('touchstart', this.onHoverMessage.bind(this));
		item.addEventListener('mouseleave', this.onHoverLeaveMessage.bind(this));
		item.addEventListener('touchend', this.onHoverLeaveMessage.bind(this));

		item.dataset.id = `${msgObj._id}`;
		item.classList.add((msgObj.sender === this.messageData.sender)?  'right': 'irrelevant');
		item.appendChild(itemMainDiv);


		//OLD
		this.messages && this.messages.appendChild(item);
		$('.chat-conversation .simplebar-content-wrapper').scrollTop(40000);
	}
	addImgMessage = (msgObj: IMsg): void=>{
		`		
            <item>
                <itemMainDiv>
                    //<itemAvatarDiv />

                    <itemContentDiv>
                        <itemContentWrapperDiv>
                            <itemContentWrapperDivOne>
								<msgImg>
									<msgImgList>
		                            	<msgImgListDivTwo />
										<msgImgListDivOne />
									</msgImgList>
								</msgImg>
								--inserted chat-time
                            </itemContentWrapperDivOne>

                            <itemContentWrapperDivTwo>
                                --inserted

                                <itemDropDowmMenu>
                                    <dropdowmFrag />
                                </itemDropDowmMenu>
                            </itemContentWrapperDivTwo>
                        </itemContentWrapperDiv>

                        //<itemName />
                    </itemContentDiv>
                </itemMainDiv>
            </item>
		`;
		//conversation-name
		const itemName = document.createElement('div');
		itemName.classList.add('conversation-name');
		itemName.innerHTML = `${msgObj.sender}`;

		const dropdowmFrag = new DocumentFragment();
		const dropdownData = [
			{ text: 'Copy', iconClass: 'file-copy' },
			{ text: 'Save', iconClass: 'save' },
			{ text: 'Forward', iconClass: 'chat-forward' },
			{ text: 'Delete', iconClass: 'delete-bin' }
		];
		dropdownData.forEach(data=>{
			const dropdownItem = document.createElement('span');
			dropdownItem.addEventListener('click', this.onMessageCollection.bind(this, data.text, { id: msgObj._id, text: data.text }));
			//dropdownItem.addEventListener('click', this.deleteMessage.bind(this, msgObj._id));
			dropdownItem.setAttribute('role', 'button');
			dropdownItem.classList.add('dropdown-item');
			dropdownItem.innerHTML = `
            	${data.text}
            	<i class="ri-${data.iconClass}-line float-end text-muted"></i>
			`;
			dropdowmFrag.appendChild(dropdownItem);
		});

		//dropdown-menu
		const itemDropDowmMenu = document.createElement('div');
		itemDropDowmMenu.classList.add('dropdown-menu');
		itemDropDowmMenu.appendChild(dropdowmFrag);

		//dropdown
		const itemContentWrapperDivTwo = document.createElement('div');
		itemContentWrapperDivTwo.classList.add('dropdown', 'align-self-start');
		itemContentWrapperDivTwo.insertAdjacentHTML(
			'afterbegin',
			`<span class="dropdown-toggle dropdown-click invisible" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <i class="ri-more-2-fill"></i>
            </span>`
        );
        itemContentWrapperDivTwo.insertAdjacentElement('beforeend', itemDropDowmMenu);

        const msgImgListDivTwo = document.createElement('div');
        msgImgListDivTwo.classList.add('message-img-link', 'btn');
        msgImgListDivTwo.innerHTML = `
        	<span>
                <i class="ri-download-2-line"></i>
            </span>
        `;
        msgImgListDivTwo.addEventListener('click', ()=>{
        	this.getFIle(this.updateFileURL(msgObj.fileURL), msgObj.message);
        });

        const msgImgListDivOne = document.createElement('div');
        msgImgListDivOne.innerHTML = `
        	<div>
                <span class="popup-img d-inline-block m-1" href="${this.updateFileURL(msgObj.fileURL)}" title="${msgObj.message}">
                    <img src="${this.updateFileURL(msgObj.fileURL)}" alt="" class="rounded border">
                </span>
            </div>
        `;

        const msgImgList = document.createElement('li');
        msgImgList.classList.add('list-inline-item', 'message-img-list', 'me-2', 'ms-0');
        msgImgList.appendChild(msgImgListDivOne);
        msgImgList.appendChild(msgImgListDivTwo);

        const msgImg = document.createElement('ul');
        msgImg.classList.add('list-inline', 'message-img', 'mb-0');
        msgImg.appendChild(msgImgList);

		//ctext-wrap-content
		const itemContentWrapperDivOne = document.createElement('div');
		itemContentWrapperDivOne.classList.add('ctext-wrap-content');
        itemContentWrapperDivOne.insertAdjacentElement('afterbegin', msgImg);
        itemContentWrapperDivOne.insertAdjacentHTML(
        	'beforeend',
        	`<p class="chat-time mb-0"><i class="ri-time-line align-middle"></i> <span class="align-middle">${this.getTimeOnly(msgObj.timeSent)}</span></p>`
        );

		//ctext-wrap
		const itemContentWrapperDiv = document.createElement('div');
		itemContentWrapperDiv.classList.add('ctext-wrap');
		itemContentWrapperDiv.appendChild(itemContentWrapperDivOne);
		itemContentWrapperDiv.appendChild(itemContentWrapperDivTwo);

		//user-chat-content
		const itemContentDiv = document.createElement('div');
		itemContentDiv.classList.add('user-chat-content');
		itemContentDiv.appendChild(itemContentWrapperDiv);
		itemContentDiv.appendChild(itemName);

		//chat-avatar
		const itemAvatarDiv = document.createElement('div');
		itemAvatarDiv.classList.add('chat-avatar');
		itemAvatarDiv.innerHTML = `
	        <span class="avatar-title rounded-circle bg-soft-primary text-primary">
	            ${msgObj.sender.charAt(0).toUpperCase()}
	        </span>
		`;

		//conversation-list
		const itemMainDiv = document.createElement('div');
		itemMainDiv.classList.add('conversation-list');
		itemMainDiv.appendChild(itemAvatarDiv);
		itemMainDiv.appendChild(itemContentDiv);		

		const item = document.createElement('li');

		item.addEventListener('mouseover', this.onHoverMessage.bind(this));
		item.addEventListener('touchstart', this.onHoverMessage.bind(this));
		item.addEventListener('mouseleave', this.onHoverLeaveMessage.bind(this));
		item.addEventListener('touchend', this.onHoverLeaveMessage.bind(this));

		item.dataset.id = `${msgObj._id}`;
		item.classList.add((msgObj.sender === this.messageData.sender)?  'right': 'irrelevant');
		item.appendChild(itemMainDiv);


		//OLD
		this.messages && this.messages.appendChild(item);
		$('.chat-conversation .simplebar-content-wrapper').scrollTop(40000);
		$(".popup-img").magnificPopup({
			type:"image",
			closeOnContentClick: true,
			mainClass:"popup-img",
			image:{
				verticalFit: true
			}
		});
	}
	addOtherFileMessage = (msgObj: IMsg): void=>{
		`		
            <item>
                <itemMainDiv>
                    //<itemAvatarDiv />

                    <itemContentDiv>
                        <itemContentWrapperDiv>
                            
                            <itemContentWrapperDivOne>
								<card>
									<cardInnerDiv>
										<cardInnerDivSubOne />
										<cardInnerDivSubTwo />
			                            <cardInnerDivSubThree />
									</cardInnerDiv>
								</card>
								--inserted chat-time
                            </itemContentWrapperDivOne>

                            <itemContentWrapperDivTwo>
                                --inserted

                                <itemDropDowmMenu>
                                    <dropdowmFrag />
                                </itemDropDowmMenu>
                            </itemContentWrapperDivTwo>
                        </itemContentWrapperDiv>

                        //<itemName />
                    </itemContentDiv>
                </itemMainDiv>
            </item>
		`;
		//conversation-name
		const itemName = document.createElement('div');
		itemName.classList.add('conversation-name');
		itemName.innerHTML = `${msgObj.sender}`;

		const dropdowmFrag = new DocumentFragment();
		const dropdownData = [
			{ text: 'Copy', iconClass: 'file-copy' },
			{ text: 'Save', iconClass: 'save' },
			{ text: 'Forward', iconClass: 'chat-forward' },
			{ text: 'Delete', iconClass: 'delete-bin' }
		];
		dropdownData.forEach(data=>{
			const dropdownItem = document.createElement('span');
			dropdownItem.addEventListener('click', this.onMessageCollection.bind(this, data.text, { id: msgObj._id, text: data.text }));
			//dropdownItem.addEventListener('click', this.deleteMessage.bind(this, msgObj._id));
			dropdownItem.setAttribute('role', 'button');
			dropdownItem.classList.add('dropdown-item');
			dropdownItem.innerHTML = `
            	${data.text}
            	<i class="ri-${data.iconClass}-line float-end text-muted"></i>
			`;
			dropdowmFrag.appendChild(dropdownItem);
		});

		//dropdown-menu
		const itemDropDowmMenu = document.createElement('div');
		itemDropDowmMenu.classList.add('dropdown-menu');
		itemDropDowmMenu.appendChild(dropdowmFrag);

		//dropdown
		const itemContentWrapperDivTwo = document.createElement('div');
		itemContentWrapperDivTwo.classList.add('dropdown', 'align-self-start');
		itemContentWrapperDivTwo.insertAdjacentHTML(
			'afterbegin',
			`<span class="dropdown-toggle dropdown-click invisible" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <i class="ri-more-2-fill"></i>
            </span>`
        );
        itemContentWrapperDivTwo.insertAdjacentElement('beforeend', itemDropDowmMenu);
		
		const cardInnerDivSubThree = document.createElement('div');
        cardInnerDivSubThree.classList.add('ms-4', 'me-0', 'btn');
        cardInnerDivSubThree.innerHTML = `
        	<span>
                <i class="ri-download-2-line"></i>
            </span>
        `;
        cardInnerDivSubThree.addEventListener('click', ()=>{
        	this.getFIle(this.updateFileURL(msgObj.fileURL), msgObj.message);
        });

        const cardInnerDivSubTwo = document.createElement('div');
        cardInnerDivSubTwo.classList.add('flex-1');
        cardInnerDivSubTwo.innerHTML = `
	        <div class="text-start">
                <h5 class="font-size-14 mb-1">${msgObj.message}</h5>
                <p class="text-muted font-size-13 mb-0">${this.formatBytes(msgObj.fileSize)}</p>
            </div>
        `;

        const cardInnerDivSubOne = document.createElement('div');
        cardInnerDivSubOne.classList.add('avatar-sm', 'me-3', 'ms-0');
        cardInnerDivSubOne.innerHTML = `
        	<div class="avatar-title bg-soft-primary text-primary rounded font-size-20">
                <i class="ri-file-text-fill"></i>
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
		const itemContentWrapperDivOne = document.createElement('div');
		itemContentWrapperDivOne.classList.add('ctext-wrap-content');
        itemContentWrapperDivOne.insertAdjacentElement('afterbegin', card);
        itemContentWrapperDivOne.insertAdjacentHTML(
        	'beforeend',
        	`<p class="chat-time mb-0"><i class="ri-time-line align-middle"></i> <span class="align-middle">${this.getTimeOnly(msgObj.timeSent)}</span></p>`
        );
		
		//ctext-wrap
		const itemContentWrapperDiv = document.createElement('div');
		itemContentWrapperDiv.classList.add('ctext-wrap');
		itemContentWrapperDiv.appendChild(itemContentWrapperDivOne);
		itemContentWrapperDiv.appendChild(itemContentWrapperDivTwo);

		//user-chat-content
		const itemContentDiv = document.createElement('div');
		itemContentDiv.classList.add('user-chat-content');
		itemContentDiv.appendChild(itemContentWrapperDiv);
		itemContentDiv.appendChild(itemName);

		//chat-avatar
		const itemAvatarDiv = document.createElement('div');
		itemAvatarDiv.classList.add('chat-avatar');
		itemAvatarDiv.innerHTML = `
        <span class="avatar-title rounded-circle bg-soft-primary text-primary">
            ${msgObj.sender.charAt(0).toUpperCase()}
        </span>
		`;

		//conversation-list
		const itemMainDiv = document.createElement('div');
		itemMainDiv.classList.add('conversation-list');
		itemMainDiv.appendChild(itemAvatarDiv);
		itemMainDiv.appendChild(itemContentDiv);		

		const item = document.createElement('li');

		item.addEventListener('mouseover', this.onHoverMessage.bind(this));
		item.addEventListener('touchstart', this.onHoverMessage.bind(this));
		item.addEventListener('mouseleave', this.onHoverLeaveMessage.bind(this));
		item.addEventListener('touchend', this.onHoverLeaveMessage.bind(this));

		item.dataset.id = `${msgObj._id}`;
		item.classList.add((msgObj.sender === this.messageData.sender)?  'right': 'irrelevant');
		item.appendChild(itemMainDiv);


		//OLD
		this.messages && this.messages.appendChild(item);
		$('.chat-conversation .simplebar-content-wrapper').scrollTop(40000);
	}
	removeMessage = (id: string): void =>{
		this.resetDOMs(groupMessengerProps.messages);
		const msgsChildren = this.messages.children;
		for(let i = 0; i < msgsChildren.length; i++){
			if(msgsChildren[i].getAttribute('data-id') === id){
				msgsChildren[i].remove();
				//figure out removing date line if no message on that date;
			}
		}
	}
	addTyping = (whoistyping: string): void=>{
		let typingExist = false;
		this.resetDOMs(groupMessengerProps.messages);
		const msgsChildren = this.messages.children;
		for(let i = 0; i < msgsChildren.length; i++){
			if(msgsChildren[i].getAttribute('data-id') === 'typing'){
				typingExist = true;
			}
		}
		//conversation-list
		const itemMainDiv = document.createElement('div');
		itemMainDiv.classList.add('conversation-list');
		itemMainDiv.innerHTML = `
            <div class="chat-avatar">
                <span class="avatar-title rounded-circle bg-soft-primary text-primary">
		            ${whoistyping.charAt(0).toUpperCase()}
		        </span>
            </div>
            
            <div class="user-chat-content">
                <div class="ctext-wrap">
                    <div class="ctext-wrap-content">
                        <p class="mb-0">
                            typing
                            <span class="animate-typing">
                                <span class="dot"></span>
                                <span class="dot"></span>
                                <span class="dot"></span>
                            </span>
                        </p>
                    </div>
                </div>

                <div class="conversation-name">${whoistyping}</div>
            </div>
		`;
		if(!typingExist){
			const item = document.createElement('li');
			item.dataset.id = `typing`;
			item.appendChild(itemMainDiv);
			this.messages && this.messages.appendChild(item);
			$('.chat-conversation .simplebar-content-wrapper').scrollTop(40000);			
		}
	}
	removeTyping = (): void=>{
		this.resetDOMs(groupMessengerProps.messages);
		const msgsChildren = this.messages.children;
		for(let i = 0; i < msgsChildren.length; i++){
			if(msgsChildren[i].getAttribute('data-id') === 'typing'){
				msgsChildren[i].remove();
			}
		}
	}
	setStatus = (username: string): void =>{
		this.groupProfileName[0].innerHTML = `#${username}`;
		this.groupProfileName[1].innerHTML = `#${username}`;
		this.groupProfileName[2].innerHTML = `#${username}`;
		this.groupProfileImgSmall.innerHTML = `
                        <!-- <img src="/images/users/avatar-4.jpg" class="rounded-circle avatar-xs" alt=""> -->
                        <div class="chat-user-img online align-self-center me-1 ms-0">
	                        <div class="avatar-xs">
		                        <span class="avatar-title rounded-circle bg-soft-primary text-primary">
		                            ${username.charAt(0).toUpperCase()}
		                        </span>
		                    </div>
	                    </div>
		`;
		this.groupProfileImgBig.innerHTML = `${username.charAt(0).toUpperCase()}`;
		this.groupOnlineDot[0].classList.add('d-none');
		this.groupOnlineDot[1].classList.add('d-none');
		document.querySelector('.group-description').innerHTML = this.groupDetails.description;
		document.querySelector('.created-by-div').classList.remove('d-none');
		document.querySelector('#about-details').classList.remove('d-none');
		document.querySelector('.chat-user-creator').innerHTML = this.groupDetails.creator;

		this.setAdmins();
		this.setUsers();

		const addUContsListCh = document.querySelector('.add-user-group-contact-list').children;
		for(let i= 0; i < addUContsListCh.length; i++){
			const alreadyInGroup = this.groupDetails.users.some(user=>{
				return addUContsListCh[i].children[0].children[0].id.split('-')[4] === user.username;
			});
			if(alreadyInGroup){
				addUContsListCh[i].remove();
				i--;
			}
		}
	}
	setAdmins = (): void=>{
        const adminsList = document.querySelector('.chat-profile-admins-list');
        adminsList.innerHTML = '';
		this.groupDetails.admins.forEach((admin, index)=>{
			const dropdowmFrag = new DocumentFragment();
			const dropdownData = [
				{ text: 'Delete', iconClass: 'delete-bin' }
			];
			dropdownData.forEach(data=>{
				const dropdownItem = document.createElement('span');
				dropdownItem.addEventListener('click', this.onRemoveAdmin.bind(this, admin.username));
				dropdownItem.setAttribute('role', 'button');
				dropdownItem.classList.add('dropdown-item');
				dropdownItem.innerHTML = `
	            	${data.text}
	            	<i class="ri-${data.iconClass}-line float-end text-muted"></i>
				`;
				dropdowmFrag.appendChild(dropdownItem);
			});

			//dropdown-menu
			const itemDropDowmMenu = document.createElement('div');
			itemDropDowmMenu.classList.add('dropdown-menu');
			itemDropDowmMenu.appendChild(dropdowmFrag);

			const itemDropDown = document.createElement('div')
			itemDropDown.classList.add('dropup');
			itemDropDown.innerHTML = `
				<span class="text-muted dropdown-toggle" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false" role='button'>
                    <i class="ri-more-2-fill"></i>
                </span>
			`;
			itemDropDown.appendChild(itemDropDowmMenu);

			const itemMainDiv = document.createElement('div');
			itemMainDiv.classList.add('d-flex', 'flex-row', 'align-items-center-4');
			itemMainDiv.innerHTML = `
                <div class="flex-1">
	                <h5 class="font-size-14 m-auto pr-4" id="profile-group-user-${admin.username}">${admin.username}</h5>
	               </div>
	        `;
			this.isAdmin() && itemMainDiv.appendChild(itemDropDown);

			const item = document.createElement('li');
			item.classList.add('mb-4', 'position-relative');
			if(index === 0){
				item.classList.add('mt-5');
			}
			item.appendChild(itemMainDiv);
            adminsList.appendChild(item);
		});
	}
	setUsers = (): void=>{
	    const userList = document.querySelector('.chat-profile-users-list');
		if(this.isAdmin()){
	        userList.innerHTML = `
	        	<button type="button" class="btn btn-link text-decoration-none text-muted font-size-18 py-0" data-bs-toggle="modal" data-bs-target="#addUserTogroup">
	                <i class="ri-user-add-line"></i>
	            </button>
	        `;
	    }else {
	    	userList.innerHTML = '';
	    }
		this.groupDetails.users.forEach((user, index)=>{
			const dropdowmFrag = new DocumentFragment();
			const dropdownData = [
				{ text: 'Make Admin', iconClass: 'arrow-drop-up' },
				{ text: 'Delete', iconClass: 'delete-bin' }
			];
			dropdownData.forEach(data=>{
				const dropdownItem = document.createElement('span');
				if(data.text === 'Delete'){
					dropdownItem.addEventListener('click', this.onRemoveUser.bind(this, user.username));
				}else{
					dropdownItem.addEventListener('click', this.onAddAdmin.bind(this, user.username));					
				}
				dropdownItem.setAttribute('role', 'button');
				dropdownItem.classList.add('dropdown-item');
				dropdownItem.innerHTML = `
	            	${data.text}
	            	<i class="ri-${data.iconClass}-line float-end text-muted"></i>
				`;
				dropdowmFrag.appendChild(dropdownItem);
			});

			//dropdown-menu
			const itemDropDowmMenu = document.createElement('div');
			itemDropDowmMenu.classList.add('dropdown-menu');
			itemDropDowmMenu.appendChild(dropdowmFrag);

			const itemDropDown = document.createElement('div')
			itemDropDown.classList.add('dropup');
			itemDropDown.innerHTML = `
				<span class="text-muted dropdown-toggle" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false" role='button'>
                    <i class="ri-more-2-fill"></i>
                </span>
			`;
			itemDropDown.appendChild(itemDropDowmMenu);

			const itemMainDiv = document.createElement('div');
			itemMainDiv.classList.add('d-flex', 'flex-row', 'align-items-center-4');
			itemMainDiv.innerHTML = `
                <div class="flex-1">
                    <h5 class="font-size-14 m-auto" id="profile-group-user-${user.username}">${user.username}</h5>
                </div>
            `;
			this.isAdmin() && itemMainDiv.appendChild(itemDropDown);


			const item = document.createElement('li');
			item.classList.add('mb-4', 'position-relative');
			if(index === 0){
				item.classList.add('mt-5');
			}
			item.appendChild(itemMainDiv);
            userList.appendChild(item);
		});
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
        document.querySelector('.chat-profile-attached-files').appendChild(item);
	}
	displayMsgsDate = (dateToDisplay: string): void =>{
		const itemMainDiv = document.createElement('div');
		const content = `
			<span class="title"> ${dateToDisplay} </span>
		`;
		itemMainDiv.classList.add('chat-day-title');
		itemMainDiv.innerHTML = content;

		const item = document.createElement('li');

		item.appendChild(itemMainDiv);
		item.dataset.id = `date`;
		this.messages && this.messages.appendChild(item);
		window.scrollTo(0, document.body.scrollHeight);
	}
	refreshGroupProfile = (): void=>{
		this.getGroupDetails();
 		setTimeout(()=>{
			this.setAdmins();
			this.setUsers();
 		}, 10000);
	}
	showAddUserGroupLoader = (): void =>{
		const itemLoaderDiv = document.createElement('div');
		itemLoaderDiv.classList.add('Loader', 'new-group-loader');
		this.addUserGroupSubmitButton.innerHTML = '';
		this.addUserGroupSubmitButton.appendChild(itemLoaderDiv);
	}
	removeAddUserGroupLoader = (): void =>{
		const itemLoaderDiv = document.querySelector('.new-group-loader');
		this.addUserGroupSubmitButton && this.addUserGroupSubmitButton.removeChild(itemLoaderDiv);
		this.addUserGroupSubmitButton.innerHTML = 'Add Users';
	}

	//event listeners
	onAddSendTextMessage = (): void =>{ this.form && this.form.addEventListener('submit', this.onSendTextSubmitCallBack); }
	onRemoveSendTextMessage = (): void=>{ this.form.removeEventListener('submit', this.onSendTextSubmitCallBack); }
	onSendTextSubmitCallBack = (e: Event)=>{
		e.preventDefault();
		if(this.msgInput && this.msgInput.value){
			//this.socket.emit('message', this.nameInput.value);
			this.setMessageData();
			this.socketOnSendTyping(false);
			const data = {
				...this.messageData,
				typeOfMsg: MsgTypeEnum.text
			}
			this.postTextMessage(data);
		}
	}
	onSubmitCallBackBinded = this.onSendTextSubmitCallBack.bind(this);
	onAddSendFileMessage = (): void =>{ this.fileForm && this.fileForm.addEventListener('submit', this.onSendFileSubmitCallBack); }
	onRemoveSendFileMessage = (): void=>{ this.fileForm.removeEventListener('submit', this.onSendFileSubmitCallBack); }
	onSendFileSubmitCallBack = (e: Event)=>{
		e.preventDefault();
		if(this.attachBtn && this.attachBtn.files.length > 0 && this.attachBtn.files[0]){
			const file = this.attachBtn.files[0];
			this.setMessageData();
			this.socketOnSendTyping(false);

			const fd = new FormData();
			fd.append('msg', file.name);
			fd.append('sender', this.getCurrentUser().username);
			fd.append('receiver', this.groupname);
			if(file.type.includes('image')){
				fd.append('typeOfMsg', MsgTypeEnum.img);
			}else {
				fd.append('typeOfMsg', MsgTypeEnum.otherfile);
			}
			fd.append('fileURL', file);

			(document.querySelector('.sendfile-btn-close') as HTMLButtonElement).click();
			this.postOtherMessage(fd);
		}
	}
	onTypingRelated = (): void=>{
		// Returns a function, that, as long as it continues to be invoked, will not
		// be triggered. The function will be called after it stops being called for
		// N milliseconds. If `immediate` is passed, trigger the function on the
		// leading edge, instead of the trailing.
		
		//important
		this.msgInput && this.msgInput.addEventListener('keydown', this.onKeydownCallback.bind(this, 'add'));
		// This will apply the debounce effect on the keyup event
		// And it only fires 500ms or half a second after the user stopped typing
		this.msgInput && this.msgInput.addEventListener('keyup', this.onKeyupCallback.bind(this, 'add'));
	}
	onTypingRelatedRemove = (): void=>{
		this.msgInput.removeEventListener('keydown', this.onKeydownCallback.bind(this, 'add'));
		this.msgInput.removeEventListener('keyup', this.onKeyupCallback.bind(this, 'add'));
	}
	onKeydownCallback = (type: string, e: Event): void=>{
		if(type === 'add'){
			this.socketOnSendTyping(true);
		}
	}
	onKeyupCallback = (type: string, e: Event): void=>{
		if(type === 'add'){
			this.debounce(()=>{
				this.socketOnSendTyping(false);
			}, 5000, 0)
			this.socketOnSendTyping(true);
		}
	}
	onAttchBtnClick = (): void=>{
		this.attachBtn.addEventListener('change', (e)=>{
			const file = (e.target as HTMLInputElement).files[0];
			//console.log(file);
			const addModalBtn = document.createElement('button');
			if(file.size > 5242880){
				addModalBtn.setAttribute('data-bs-target', '#filetolarge');
			}else{
				addModalBtn.setAttribute('data-bs-target', '#sendfile');
			}
			addModalBtn.setAttribute('type', 'button');
			addModalBtn.setAttribute('data-bs-toggle', 'modal');
			document.body.appendChild(addModalBtn);
			document.querySelectorAll('.file-name')[0].innerHTML = file && file.name;
			document.querySelectorAll('.file-name')[1].innerHTML = file && file.name;
			document.querySelectorAll('.file-size')[0].innerHTML = file && this.formatBytes(file.size);
			document.querySelectorAll('.file-size')[1].innerHTML = file && this.formatBytes(file.size);
			addModalBtn.click();
			document.body.removeChild(addModalBtn);
		});
	}
	onMessageCollection = (type: string, otherData: MessageCollectionOption, e: Element): void=>{
		switch (type) {
			case "Delete":
				this.deleteMessage(otherData.id, e);
				break;			
			case "Copy":
				this.onCopy(otherData.text, e);
				break;
			default:
				// code...
				break;
		}
	}
	onCopy = (text: string, e: Element): void=>{
		const fallbackCopy = (text: string): void=>{
			let textArea = document.createElement('textarea');
			textArea.value = text;

			textArea.style.top = '0';
			textArea.style.left = '0';
			textArea.style.position = 'fixed';
			document.appendChild(textArea);
			textArea.focus();
			textArea.select();
			textArea.setSelectionRange(0, 9999999);

			try {
				var successful = document.execCommand('copy');
				var msg = successful ? 'successful' : 'unsuccessful';
				//console.log('Fallback: Copying text command was ' + msg);
			} catch (err) {
				console.error('Fallback: Oops, unable to copy', err);
			}
			document.body.removeChild(textArea);
		}
		if (!navigator.clipboard) {
			fallbackCopy(text);
			return;
		}
		navigator.clipboard.writeText(text).then(function() {
			//console.log('Async: Copying to clipboard was successful!');
		}, function(err) {
			console.error('Async: Could not copy text: ', err);
		});
	}
	onHoverMessage = (e: Event): void=>{
		//console.log(e.type);
		//console.log(e.target);
		const dropdown = <Element>e.target;
		if(dropdown.classList.contains('ctext-wrap-content')){
			dropdown.nextElementSibling.children[0].classList.add('visible');
			dropdown.nextElementSibling.children[0].classList.remove('invisible');
			setTimeout(()=>{
				dropdown.nextElementSibling.children[0].classList.remove('visible');
				dropdown.nextElementSibling.children[0].classList.add('invisible');
			}, 20000);
		}
	}
	onHoverLeaveMessage = (e: Event): void=>{
		const dropdown = <Element>e.target;
		if(dropdown.classList.contains('ctext-wrap-content')){
			dropdown.nextElementSibling.children[0].classList.remove('visible');
			dropdown.nextElementSibling.children[0].classList.add('invisible');			
		}
	}
	onAddUserGroupSubmitForm = (): void=>{
		this.addUserToGroupForm.addEventListener('submit', (e)=>{
			e.preventDefault();
			this.showAddUserGroupLoader();
			const formEle = this.addUserToGroupForm.elements;
			for(let i = 0; i < formEle.length; i++){
				if((formEle[i] as HTMLInputElement).checked){
					const formEleItem: Element = formEle[i];
					const username = (formEleItem as NonDocumentTypeChildNode).nextElementSibling.innerHTML;
					this.addUserToGroup({ username });
				}
			}
			$('#addUserTogroup').modal('hide');
			this.removeAddUserGroupLoader();
		});
	}
	onAddAdmin = (username: string): void=>{
		this.addAdminToGroup({ username });
	}
	onRemoveAdmin = (username: string): void=>{
		this.removeAdminFromGroup({ username });
	}
	onAddUser = (username: string): void=>{
		this.addUserToGroup({ username });
	}
	onRemoveUser = (username: string): void=>{
		this.removeUserFromGroup({ username });
	}

	//ajax
	addAdminToGroup = (data): void=>{
		const { receiver } = this.messageData;
		$.post(`/api/group/add-admin/${receiver}`, data)
		 .done(response=>{
		 	if(response.data.success){
		 		this.refreshGroupProfile();
		 	}
		 })
		 .fail(err=>{
		 	console.log(err);
		 });
	}
	removeAdminFromGroup = (data): void=>{
		const { receiver } = this.messageData;
		$.post(`/api/group/remove-admin/${receiver}`, data)
		 .done(response=>{
		 	if(response.data.success){
		 		this.refreshGroupProfile();
		 	}
		 })
		 .fail(err=>{
		 	console.log(err);
		 });
	}
	addUserToGroup = (data): void=>{
		const { receiver } = this.messageData;
		$.post(`/api/group/add-user/${receiver}`, data)
		 .done(response=>{
		 	if(response.data.success){
		 		this.refreshGroupProfile();
		 	}
		 })
		 .fail(err=>{
		 	console.log(err);
		 });
	}
	removeUserFromGroup = (data): void=>{
		const { receiver } = this.messageData;
		$.post(`/api/group/remove-user/${receiver}`, data)
		 .done(response=>{
		 	if(response.data.success){
		 		this.refreshGroupProfile();
		 	}
		 })
		 .fail(err=>{
		 	console.log(err);
		 });
	}
	getGroupDetails = (): void=>{
		const { receiver } = this.messageData;
		$.get(`/api/group/details/${receiver}`)
		 .done(response=>{
		 	if(response.data.success){
			 	this.groupDetails = response.data.group;
		 	}
		 })
		 .fail(err=>{
		 	console.log(err);
		 });
	}
	getGroupMessage = (): void => {
		if(this.messages){
			this.messages.innerHTML = '';
		}
		const { receiver } = this.messageData;
		$.get(`/api/group/messages/all/${receiver}`)
		 .done((response)=>{
		 	const messages: IMsg[] = response.data.messages;
		 	if(messages.length === 0){
		 		this.messages.innerHTML = 'Welcome to your chatroom, use the input box below to start sending your messages';
		 	}
			this.lastDate = '';
		 	messages.forEach(msg=>{
				msg.timeSent = this.changeDate(msg);
				let today  = new Date().toDateString().substr(4);
				if(today !== msg.timeSent.toDateString().substr(4)){
					if(!this.lastDate || this.lastDate !== msg.timeSent.toDateString().substr(4)){
						this.displayMsgsDate(msg.timeSent.toDateString().substr(4));
						this.lastDate = msg.timeSent.toDateString().substr(4);
					}
				}else{
					if(!this.lastDate || this.lastDate !== msg.timeSent.toDateString().substr(4)){
						this.displayMsgsDate('Today');
						this.lastDate = msg.timeSent.toDateString().substr(4);
					}
				}
				this.addMessage(msg);
		 	});
			$('.chat-conversation .simplebar-content-wrapper').scrollTop(40000);
		 }).fail(err=>{
		 	console.log(err);
		 });
	}
	deleteMessage = (id: number, e: Element) =>{
		$.ajax({
			url: `/api/message/${id}`,
			type: 'DELETE'
		}).done(response=>{
			//console.log(response);
		}).fail(err=>{
			console.log(err);
		});
	}
	postTextMessage = (data): void =>{
		$.post('/api/group/message', data)
		 .done((response)=>{
			if(response.data.success){
				this.msgInput.value = '';
			}
		 }).fail(err=>{
			console.log(err);
		 });
	}
	postOtherMessage = (data): void =>{
		$.post({
			url: '/api/group/message',
			data: data,
			processData: false,
			contentType: false
		}).done((response)=>{
			if(response.data.success){
				this.msgInput.value = '';
			}
		}).fail(err=>{
			console.log(err);
		});
	}
	clearUnreadMsg = (): void=>{
		const data = {
			sender: this.messageData.sender,
			receiver: this.messageData.receiver
		};
		$.post('/api/user/clear-unread', data)
		 .done((response)=>{
		 	if(response.data.success){

		 	}
		 }).fail(err=>{
			console.log(err);
		 });
	}
	getAttachmentMessages = (username: string): void=>{
		document.querySelector('.chat-profile-attached-files').innerHTML = '';
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

	//utils
	isAdmin = (): boolean=>{
		this.getGroupDetails();
		const { username } = this.getCurrentUser();
		return !this.groupDetails.admins.some(admin=>{
					return admin.username !== username;
				});
	}
	debounce = function (func, wait, immediate) {
		var timeout;
		return function() {
			var context = this, args = arguments;
			var later = function() {
				timeout = null;
				if (!immediate) func.apply(context, args);
			};
			var callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) func.apply(context, args);
		};
	};
	changeDate = (msg: IMsg): Date =>{ return new Date(msg.timeSent); }
	getTimeOnly = (dateObj: Date): string =>{ 
		return `
			${dateObj.getHours()}:${(dateObj.getMinutes()<10)? 
				'0' + dateObj.getMinutes(): dateObj.getMinutes()}
		`; 
	}
	formatBytes = (bytes, decimals = 2): string =>{
	    if (bytes === 0) return '0 Bytes';

	    const k = 1024;
	    const dm = decimals < 0 ? 0 : decimals;
	    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

	    const i = Math.floor(Math.log(bytes) / Math.log(k));

	    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
	}
    getCurrentUser = (): StorageUser=>{ return JSON.parse(localStorage.getItem('chatapp-user')); }
    userAvailable = (): boolean=>{
    	if(JSON.parse(localStorage.getItem('chatapp-user'))){
    		return true;
    	}
    	return false;
    }
	updateFileURL(fileURL: string){
		if(window.location.origin === 'http://localhost:8080' || window.location.origin === 'http://192.168.43.240:8080'){
			return 'api/' + fileURL;
		}
		return fileURL;
	}
	getIndexPage = (): void =>{ window.location.href = '/'; }
	getLoginPage = (): void =>{ window.location.href = '/login'; }
}