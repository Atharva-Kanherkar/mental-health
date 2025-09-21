import { Server, Socket, ServerOptions } from 'socket.io';
import { Server as HttpServer } from 'http';
import { auth } from '../utils/auth';

export class SocketService{
    private io : Server;
    
    constructor(){
        this.io = null!;
    }

    public initialize(httpServer : HttpServer, options : Partial<ServerOptions> = {}) : void {
           this.io = new Server(httpServer, options);
           this.io.on('connection', this.handleConnection);
    }

    private handleConnection = async (socket : Socket) : Promise<void> => {
         console.log(`Web socket connection established! The socketid is ${socket.id}`);
          socket.on('authenticate', async (data : {token : string}) =>{
             console.log(`Recieved a token ${data.token}`);
            const userId =   await this.getUserIdFromToken(data.token)
            if(userId){
                console.log("User found, token recived using better Auth. Sucesss");
                socket.join(`Room-${userId}`)
                socket.emit('Authenticated', {message : "Welcome user. You are in the room."});
                }
                else{
                    console.log("User not found. Not authenticated.")
                    socket.emit("unauthorized", {message : "USER IS NOT AUTHENTICATED"});
                    socket.disconnect(true);
                }
          }) 
   
          

    }

        public sendMessageToUser(userId : string, eventName : string, payload : object) : void {
           console.log(`Attempting to send the event ${eventName} to room 'Room-${userId}'`)
              this.io.to(`Room-${userId}`).emit(eventName, payload);

       }

    private async getUserIdFromToken(token: string): Promise<string | null> {
        try {
            // Create headers with the authentication token
            const headers = new Headers();
            headers.set('cookie', `better-auth.session_token=${token}`);

            // Get session from Better Auth
            const session = await auth.api.getSession({
                headers: headers
            });

            if (!session || !session.user) {
                console.log('Invalid or expired token');
                return null;
            }

            return session.user.id;
        } catch (error) {
            console.error('Error validating token:', error);
            return null;
        }
    }
}