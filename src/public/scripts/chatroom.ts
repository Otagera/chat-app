//import $ from 'jquery';
//nothin cause it'll assume that its all on the same server alse put io(url)
let socket = io();
interface IMsg extends Usernames{
	_id: number;
	message: string;
	timeSent: Date;
}
interface Usernames{
	sender: string;
	receiver: string;
}
interface StatusInfo {
	id: string;
}
interface RegisterInfo {
	usernames: Usernames
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

const enum props {
	messages = 'messages',
	form = 'form',
	msgInput = 'msgInput',
	connectionStatus = 'connectionStatus'
};
class Messenger{
	lastDate = '';
	sideColorArray = ['#56b273', '#b388dd', '#ff8750', '#01AD9B'];
	sideColorMap = new Map<string, string>();
	messageData: { [key: string]: string};

	messages: HTMLElement = document.querySelector('#chatroom-messages');
	form: Element = document.querySelector('#chatroom-form');
	msgInput: HTMLInputElement = <HTMLInputElement>document.querySelector('#chatroom-msg');
	connectionStatus: HTMLElement = document.querySelector('#chatroom-connection-status');

	setMessageData = (): void =>{
		this.messageData = {
			msg: this.msgInput.value,
			sender: this.getCurrentUser().username,
			receiver: window.location.pathname.substr(10)
		}
	}
	setSideColorMap = (): void=>{
		this.sideColorMap.set(
			this.messageData.sender,
			this.sideColorArray.splice(Math.floor(Math.random()*this.sideColorArray.length), 1)[0]
		);this.sideColorMap.set(
			this.messageData.receiver,
			this.sideColorArray.splice(Math.floor(Math.random()*this.sideColorArray.length), 1)[0]
		);		
	}
	resetDOMs = (propsToReset: string): void =>{
		switch (propsToReset) {
			case props.messages:
				this[props.messages] = document.querySelector('#chatroom-messages');
				break;
			case props.form:
				this[props.form] = document.querySelector('#chatroom-messages');
				break;
			case props.msgInput:
				this[props.msgInput] = document.querySelector('#chatroom-messages');
				break;
			case props.connectionStatus:
				this[props.connectionStatus] = document.querySelector('#chatroom-messages');
				break;
			default:
				break;
		}
		this.form = document.querySelector('#chatroom-form');
		this.msgInput = <HTMLInputElement>document.querySelector('#chatroom-msg');
		this.connectionStatus = document.querySelector('#chatroom-connection-status');
	}

	init = (): void => {
		if(!this.userAvailable()){
			this.getIndexPage();
		}
		//initialize sockets
		this.socketOnStatus();
		this.socketOnOnline();
		this.socketOnMsgSend();
		this.socketOnMsgDelete();

				
		this.messages.innerHTML = 'Loading.....';
		this.getUserStatus();
		this.setSideColorMap();
		this.getSenderReceiverMessage();
		this.onSendMessage();

	}

	//sockets
	socketOnOnline = (): void =>{
		socket.on('online', (onlineInfo: OnlineInfo)=>{
			this.setMessageData();
			if(onlineInfo.username === this.messageData.receiver){
				this.setStatus(onlineInfo.username, onlineInfo.online);
			}
		});
	}
	socketOnStatus = (): void =>{
		socket.on('status', (info: StatusInfo)=>{
			this.setMessageData();
			const registerSend: RegisterInfo = {
				usernames: {
					sender: this.messageData.sender,
					receiver: this.messageData.receiver
				},
				socketId: info.id
			}
			this.clearUnreadMsg();
			socket.emit('registerId', registerSend);
		});
	}
	socketOnMsgSend = (): void =>{
		socket.on('send-msg', (msg: IMsg)=>{
			msg.timeSent = this.changeDate(msg);
			if(!this.lastDate || this.lastDate !== msg.timeSent.toLocaleDateString()){
				this.displayMsgsDate('Today');
				this.lastDate = msg.timeSent.toLocaleDateString();
			}
			this.addMessage(msg);
		});
	}
	socketOnMsgDelete = (): void =>{
		//add feature
		//subtly remove delete element
		socket.on('delete-msg', (data)=>{
			this.resetDOMs(props.messages);
			const msgsChildren = this.messages.children;
			for(let i = 0; i < msgsChildren.length; i++){
				if(msgsChildren[i].getAttribute('data-id') === data.msgDeleted._id){
					msgsChildren[i].remove();
					console.log(msgsChildren[i-1].innerHTML);
				}
			}
		});
	}

	//DOM changers
	addMessage = (msgObj: IMsg): void => {
		const itemMainDiv = document.createElement('div');
		const content = `
			<p> ${msgObj.message} </p>
		`;
		itemMainDiv.innerHTML = content;

		const itemTimeDiv = document.createElement('p');
		itemTimeDiv.innerText = `${this.getTimeOnly(msgObj.timeSent)}`;
		itemTimeDiv.style.display = 'none';
		itemTimeDiv.classList.add('msg-time');
		const itemDelDiv = document.createElement('p');
		itemDelDiv.addEventListener('click', this.deleteMessage.bind(this, msgObj._id));
		itemDelDiv.innerText = `Delete`;
		itemDelDiv.style.display = 'none';
		itemDelDiv.classList.add('msg-delete');

		const item = document.createElement('li');
		item.addEventListener('mouseover', ()=>{
			if(msgObj.sender === this.messageData.sender){
				itemDelDiv.style.display = 'block';
			}
			itemTimeDiv.style.display = 'block';
			setTimeout(()=>{
				itemDelDiv.style.display = 'none';
				itemTimeDiv.style.display = 'none';
			}, 20000);
		});
		item.addEventListener('mouseleave', ()=>{
			itemDelDiv.style.display = 'none';
			if(msgObj.sender === this.messageData.sender){
				itemTimeDiv.style.display = 'none';				
			}
		});

		item.style.borderColor = this.sideColorMap.get(msgObj.sender);
		item.dataset.id = `${msgObj._id}`;
		item.classList.add('message', (msgObj.sender === this.messageData.sender)?  'sender': 'receiver');
		item.appendChild(itemMainDiv);
		item.appendChild(itemTimeDiv);
		item.appendChild(itemDelDiv);
		this.messages && this.messages.appendChild(item);
		window.scrollTo(0, document.body.scrollHeight);
	}
	setStatus = (username: string, onlineStatus: boolean): void =>{
		this.connectionStatus.style.backgroundColor = (onlineStatus)? 'aquamarine': 'orangered';
		this.connectionStatus.innerHTML = `
					${username}: ${(onlineStatus)? 'Online': 'Offline'}
				`;
	}
	displayMsgsDate = (dateToDisplay: string): void =>{
		const itemMainDiv = document.createElement('div');
		const content = `
			<p> ${dateToDisplay} </p>
		`;
		itemMainDiv.innerHTML = content;

		const item = document.createElement('li');
		item.classList.add('msgs-date');

		item.appendChild(itemMainDiv);
		this.messages && this.messages.appendChild(item);
		window.scrollTo(0, document.body.scrollHeight);
	}

	//event listeners
	onSendMessage = (): void =>{
		this.form && this.form.addEventListener('submit', (e)=>{
			e.preventDefault();
			if(this.msgInput && this.msgInput.value){
				//socket.emit('message', this.nameInput.value);
				this.setMessageData();
				this.postMessage();
			}
		});
	}

	//ajax
	deleteMessage = (id, e) =>{
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
		$.get('/api/messages')
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
		this.messages.innerHTML = '';
		const { sender, receiver} = this.messageData;
		$.get(`/api/messages/${sender}/${receiver}`)
		 .done((response)=>{
		 	const messages: IMsg[] = response.data.messages;
		 	if(messages.length === 0){
		 		this.messages.innerHTML = 'Welcome to your chatroom, use the input box below to start sending your messages';
		 	}
			this.lastDate = '';
		 	messages.forEach(msg=>{
				msg.timeSent = this.changeDate(msg);
				let today  = new Date().toLocaleDateString();
				if(today !== msg.timeSent.toLocaleDateString()){
					if(!this.lastDate || this.lastDate !== msg.timeSent.toLocaleDateString()){
						this.displayMsgsDate(msg.timeSent.toLocaleDateString());
						this.lastDate = msg.timeSent.toLocaleDateString();
					}
				}else{
					if(!this.lastDate || this.lastDate !== msg.timeSent.toLocaleDateString()){
						this.displayMsgsDate('Today');
						this.lastDate = msg.timeSent.toLocaleDateString();
					}
				}
				this.addMessage(msg);
		 	});
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
	postMessage = (): void =>{
		if(this.connectionStatus.style.backgroundColor === 'aquamarine'){
			this.messageData['read'] = 'true';
		}else if(this.connectionStatus.style.backgroundColor === 'orangered'){
			this.messageData['read'] = 'false';
		}
		$.post('/api/message', this.messageData)
		 .done((response)=>{
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

	//utils
	changeDate = (msg: IMsg): Date =>{ return new Date(msg.timeSent); }
	getTimeOnly = (dateObj: Date): string =>{ 
		return `
			${dateObj.getHours()}:${(dateObj.getMinutes()<10)? 
				'0' + dateObj.getMinutes(): dateObj.getMinutes()}
		`; 
	}
    getCurrentUser = (): StorageUser=>{
    	return JSON.parse(localStorage.getItem('chatapp-user'));
    }
    userAvailable = (): boolean=>{
    	if(JSON.parse(localStorage.getItem('chatapp-user'))){
    		return true;
    	}
    	return false;
    }
	getIndexPage = (): void =>{
		window.location.href = '/';
	}
}
const msg = new Messenger();
msg.init();