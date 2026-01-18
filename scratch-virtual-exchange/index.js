const client_id = 'gfmucqaudg8w80g';
const redirect_uri = 'https://sakadayo.github.io/scratch-virtual-exchange';
class Update{
    connect(){
        const ok = confirm(
        "Dropbox の認証画面が開きます。\nこれは安全な公式の認証手順です。\n続行してもよろしいですか？"
        );
        if (!ok) return;
        console.log(client_id);
        console.log(redirect_uri);
        console.log(`https://www.dropbox.com/oauth2/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code`);
    }
}

var ins = new Update();
ins.connect();