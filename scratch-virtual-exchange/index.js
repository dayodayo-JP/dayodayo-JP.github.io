const client_id = 'gfmucqaudg8w80g';
const redirect_uri = 'https://sakadayo.github.io/scratch-virtual-exchange';
class Update{
    connect(){
        console.log(client_id);
        console.log(redirect_uri);
        console.log(`https://www.dropbox.com/oauth2/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code`);
    }
}

var ins = new Update();
ins.connect();