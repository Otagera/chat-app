
interface IMsg extends Usernames{
	_id: number;
	message: string;
	timeSent: Date;
	read: boolean;
	typeOfMsg: MsgTypeEnum;
	fileURL?: string;
	fileSize?: number;
}
enum MsgTypeEnum {
	text = 'text',
	img = 'img',
	otherfile = 'otherfile'
}
interface Usernames{
	sender: string;
	receiver: string;
}
interface StatusInfo {
	id: string;
}
interface Typings {
	usernames: Usernames
	typing: boolean;
}
interface RegisterMessenger {
	usernames: Usernames;
	socketId: string;
}
interface RegisterInfo {
	username: string;
	socketId: string;
}
interface OnlineInfo{
  online: boolean;
  username: string;
}
interface StorageUser {
	username: string;
	token: string;
}
interface MessageCollectionOption{
	id: number;
	text: string
}

const enum props {
	messages = 'messages',
	form = 'form',
	msgInput = 'msgInput',
	userOnlineDot = 'userOnlineDot'
};
class Messenger{
	socket = io();
	lastDate = '';
	messageData: { [key: string]: string};

	userProfileImgSmall: HTMLElement = document.querySelector('.chat-user-avatar-container-small');
	userProfileImgBig: HTMLElement = document.querySelector('.chat-user-avatar-container-big');
	userProfileName: NodeListOf<HTMLElement> = document.querySelectorAll('.chat-user-name');
	userOnlineDot: NodeListOf<HTMLElement> = document.querySelectorAll('.chat-user-online-dot');
	messages: HTMLElement = document.querySelector('#chatroom-messages');
	form: Element = document.querySelector('#chatroom-form');
	msgInput: HTMLInputElement = <HTMLInputElement>document.querySelector('#chatroom-msg');
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

	constructor(public receiver: string){}
	setMessageData = (): void =>{
		this.messageData = {
			msg: this.msgInput && this.msgInput.value,
			sender: this.getCurrentUser().username,
			receiver: this.receiver
		}
	}
	resetDOMs = (propsToReset: string): void =>{
		switch (propsToReset) {
			case props.messages:
				this[props.messages] = document.querySelector('#chatroom-messages');
				break;
			case props.form:
				this[props.form] = document.querySelector('#chatroom-form');
				break;
			case props.msgInput:
				this[props.msgInput] = <HTMLInputElement>document.querySelector('#chatroom-msg');
				break;
			case props.userOnlineDot:
				//this[props.userOnlineDot] = document.querySelector('.user-online-dot');
				break;
			default:
				break;
		}
	}

	init = (): void => {
		if(!this.userAvailable()){
			this.getLoginPage();
		}				
		if(this.messages){
			this.messages.innerHTML = 'Loading.....';
		}
		if(this.receiver === 'Welcome'){
			this.welcomeSetup();
		}else{
			//initialize sockets
			this.socketOnStatus();
			this.socketOnOnline();
			this.socketOnMsgSend();
			this.socketOnMsgDelete();
			this.socketOnReceiveTyping();

			this.getUserStatus();
			this.getSenderReceiverMessage();			

			this.onAddSendTextMessage();
			this.onAddSendFileMessage();
			this.onTypingRelated();
			this.onAttchBtnClick();
			//this.onEmojiKeyboardInit();
		}
	}

	//sockets
	socketOnOnline = (): void =>{
		this.socket.on('online', (onlineInfo: OnlineInfo)=>{
			this.setMessageData();
			if(onlineInfo.username === this.messageData.receiver){
				this.setStatus(onlineInfo.username, onlineInfo.online);
			}
		});
	}
	socketOnStatus = (): void =>{
		this.socket.on('status', (info: StatusInfo)=>{
			this.setMessageData();
			const registerSend: RegisterMessenger = {
				usernames: {
					sender: this.messageData.sender,
					receiver: this.messageData.receiver
				},
				socketId: info.id
			}
			this.clearUnreadMsg();
			this.socket.emit('register-chatroom', registerSend);
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
		this.socket.emit('chatroom-disconnect');
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
		//itemContentDiv.appendChild(itemName);

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
		//itemMainDiv.appendChild(itemAvatarDiv);
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
		//itemContentDiv.appendChild(itemName);

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
		//itemMainDiv.appendChild(itemAvatarDiv);
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
        /*
		//ctext-wrap-content
		const itemContentWrapperDivOne = document.createElement('div');
		itemContentWrapperDivOne.classList.add('ctext-wrap-content')
		itemContentWrapperDivOne.innerHTML = `
            <div class="card p-2 mb-2">
                <div class="d-flex align-items-center">
                    <div class="avatar-sm me-3 ms-0">
                        <div class="avatar-title bg-soft-primary text-primary rounded font-size-20">
                            <i class="ri-file-text-fill"></i>
                        </div>
                    </div>
                    <div class="flex-1">
                        <div class="text-start">
                            <h5 class="font-size-14 mb-1">${msgObj.message}</h5>
                            <p class="text-muted font-size-13 mb-0">${this.formatBytes(msgObj.fileSize)}</p>
                        </div>
                    </div>
                    <div class="ms-4 me-0">
                        <a href="${this.updateFileURL(msgObj.fileURL)}" download="${msgObj.message}" class="text-muted">
                            <i class="ri-download-2-line"></i>
                        </a>
                    </div>
                </div>
            </div>
            <p class="chat-time mb-0"><i class="ri-time-line align-middle"></i> <span class="align-middle">${this.getTimeOnly(msgObj.timeSent)}</span></p>			
		`;
		*/
		//ctext-wrap
		const itemContentWrapperDiv = document.createElement('div');
		itemContentWrapperDiv.classList.add('ctext-wrap');
		itemContentWrapperDiv.appendChild(itemContentWrapperDivOne);
		itemContentWrapperDiv.appendChild(itemContentWrapperDivTwo);

		//user-chat-content
		const itemContentDiv = document.createElement('div');
		itemContentDiv.classList.add('user-chat-content');
		itemContentDiv.appendChild(itemContentWrapperDiv);
		//itemContentDiv.appendChild(itemName);

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
		//itemMainDiv.appendChild(itemAvatarDiv);
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
		this.resetDOMs(props.messages);
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
		this.resetDOMs(props.messages);
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
		this.resetDOMs(props.messages);
		const msgsChildren = this.messages.children;
		for(let i = 0; i < msgsChildren.length; i++){
			if(msgsChildren[i].getAttribute('data-id') === 'typing'){
				msgsChildren[i].remove();
			}
		}
	}
	setStatus = (username: string, onlineStatus: boolean): void =>{
		this.userProfileName[0].innerHTML = username;
		this.userProfileName[1].innerHTML = username;
		this.userProfileImgSmall.innerHTML = `
                        <!-- <img src="/images/users/avatar-4.jpg" class="rounded-circle avatar-xs" alt=""> -->
                        <div class="chat-user-img online align-self-center me-1 ms-0">
	                        <div class="avatar-xs">
		                        <span class="avatar-title rounded-circle bg-soft-primary text-primary">
		                            ${username.charAt(0).toUpperCase()}
		                        </span>
		                    </div>
	                    </div>
		`;
		this.userProfileImgBig.innerHTML = `${username.charAt(0).toUpperCase()}`;
		if(onlineStatus){
			this.userOnlineDot[0].classList.remove('text-warning');
			this.userOnlineDot[0].classList.add('text-primary');
			this.userOnlineDot[1].classList.remove('text-warning');
			this.userOnlineDot[1].classList.add('text-primary');
		}else{
			this.userOnlineDot[0].classList.add('text-warning');
			this.userOnlineDot[0].classList.remove('text-primary');
			this.userOnlineDot[1].classList.add('text-warning');
			this.userOnlineDot[1].classList.remove('text-primary');
		}
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
	welcomeSetup = (): void=>{
		this.setMessageData();
	 	this.setStatus(this.messageData.receiver, true);
		this.messages.innerHTML = '';
		setTimeout(()=>{
			const firstMessage: IMsg = {
				sender: 'Welcome',
				receiver: this.getCurrentUser().username,
				_id: 0,
				read: false,
				message: `Welcome ${this.getCurrentUser().username} to my chatapp`,
				timeSent: new Date(Date.now()),
				typeOfMsg: MsgTypeEnum.text
			};
			this.addMessage(firstMessage);
		}, 2000);
		setTimeout(()=>{
			const secondMessage: IMsg = {
				sender: 'Welcome',
				receiver: this.getCurrentUser().username,
				_id: 0,
				read: false,
				message: `
				To get started you can start sending messages to friends that have already signed up to our platform,
				all you'll need is the username, click on the add chat button <i class="ri-user-add-line"></i> on the
				home button and youself can get started.
				`,
				timeSent: new Date(Date.now()),
				typeOfMsg: MsgTypeEnum.text
			};
			this.addMessage(secondMessage);
		}, 5000);
		setTimeout(()=>{
			const thirdMessage: IMsg = {
				sender: 'Welcome',
				receiver: this.getCurrentUser().username,
				_id: 0,
				read: false,
				message: `
				P.S. You can try out leo or lenzo, and ill be there to reply your message.
				`,
				timeSent: new Date(Date.now()),
				typeOfMsg: MsgTypeEnum.text
			};
			this.addMessage(thirdMessage);
		}, 7000);
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
			fd.append('receiver', this.receiver);
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
	/*
	onEmojiKeyboardInit = (): void=>{
		this.emojiBtn.addEventListener('click', ()=>{ });
	}
	*/
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

	//ajax
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
	getAllMessages = (): void => {
		this.messages.innerHTML = '';
		$.get('/api/messages/all')
		 .done((response)=>{
		 	const messages: IMsg[] = response.data.messages;
		 	if(messages.length === 0){
		 		this.messages.innerHTML = 'Welcome to your chatroom, use the input box below to start sending your messages';
		 	}
		 	messages.forEach((msg: IMsg)=>{
				msg.timeSent = this.changeDate(msg);
		 		this.addMessage(msg);
		 	});
		 }).fail(err=>{
		 	console.log(err);
		 });
	}
	getSenderReceiverMessage = (): void => {
		if(this.messages){
			this.messages.innerHTML = '';
		}
		const { sender, receiver} = this.messageData;
		$.get(`/api/messages/all/${sender}/${receiver}`)
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
	getUserStatus = (): void =>{
		this.setMessageData();
		$.get(`/auth/status/${this.messageData.receiver}`)
		 .done(response=>{
		 	this.setStatus(this.messageData.receiver, response.data.status);
		 })
		 .fail(err=>{
		 	console.log(err);
		 });
	}
	postTextMessage = (data): void =>{
		$.post('/api/message', data)
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
			url: '/api/message',
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
	formatBytes = (bytes, decimals = 2): string =>{
	    if (bytes === 0) return '0 Bytes';

	    const k = 1024;
	    const dm = decimals < 0 ? 0 : decimals;
	    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

	    const i = Math.floor(Math.log(bytes) / Math.log(k));

	    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
	}
}
//const msg = new Messenger();
//msg.init();