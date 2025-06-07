// Run electron
import electron, { Menu } from "electron";
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

let win; // khai báo biên win dùng để tạo lên một cửa sổ window của app

// Hàm tạo cửa sổ app
function createWindow() {
  Menu.setApplicationMenu(null);
  win = new BrowserWindow({ width: 1152, height: 789 }); // khai báo độ cao và rộng của cửa sổ

  win.loadURL("http://localhost:5173"); // load url của bạn, ở đây là localhost:3000 vì bạn đang chạy reactjs app trên port 3000

  //win.webContents.openDevTools(); // cái này là cho phép bạn sử dụng devtool như browser để dùng cho debug thôi, không có gì đặc biệt

  // khi close thì ta xóa cửa sổ đi
  win.on("close", function () {
    win = null;
  });
}

// lắng nghe khi app sẵn sàng thì sẽ khởi tạo cửa sổ app
app.on("ready", createWindow);

// Khi close thì quit khỏi app
app.on("window-all-closed", function () {
  app.quit();
});

app.on("activate", function () {
  if (win == null) {
    createWindow();
  }
});