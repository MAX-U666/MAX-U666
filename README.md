# GMV MAX AI决策中枢 - 部署指南

## 📦 项目结构
```
gmv-max-deploy/
├── package.json
├── public/
│   └── index.html
├── src/
│   ├── index.js
│   └── App.js          # 主应用代码
└── README.md
```

## 🚀 部署步骤

### 1. 上传到GitHub
```bash
# 在本地
git init
git add .
git commit -m "初始化GMV MAX系统"
git remote add origin git@github.com:你的用户名/gmv-max-system.git
git push -u origin main
```

### 2. 服务器拉取代码
```bash
# SSH登录服务器
ssh root@你的服务器IP

# 进入项目目录
cd /www  # 或你的目录
git clone git@github.com:你的用户名/gmv-max-system.git gmv-max
cd gmv-max

# 安装依赖
npm install

# 打包生产版本
npm run build
```

### 3. 配置Nginx

编辑Nginx配置：
```bash
vim /etc/nginx/sites-available/gmv-max.conf
```

配置内容：
```nginx
server {
    listen 80;
    server_name gmv.你的域名.com;

    root /www/gmv-max/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
```

启用配置：
```bash
ln -s /etc/nginx/sites-available/gmv-max.conf /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 4. 更新代码流程
```bash
# 以后更新代码
cd /www/gmv-max
git pull origin main
npm run build
# 自动生效，无需重启
```

## 🔧 常见问题

### Q: 白屏？
检查Nginx root路径是否正确指向 `build` 目录

### Q: 刷新404？
确保Nginx配置了 `try_files $uri $uri/ /index.html;`

### Q: 想用HTTPS？
```bash
# 用certbot申请免费证书
apt install certbot python3-certbot-nginx
certbot --nginx -d gmv.你的域名.com
```

## 📱 访问地址
部署完成后访问：http://gmv.你的域名.com

---
版本：v1.0.0
日期：2025年1月
