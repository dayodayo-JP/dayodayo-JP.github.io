var button = document.getElementByID("button");
button.style.visibility = 'hidden';
function change(){
    var text = document.getElementByID("already?");
    //ここに処理をするコードを書く
    text.textContent = "ファイルは用意されました。ダウンロードボタンを押して下さい。";
    button.style.visibility = 'visibility';
}