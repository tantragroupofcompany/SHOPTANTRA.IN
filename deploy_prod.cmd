@echo off
cd /d "C:\TANTRA GROUP OF INDUSTRIES\SHOPTANTRA"
vercel --prod --yes > vercel_deploy.txt 2>&1
echo DEPLOY_EXIT_CODE_%ERRORLEVEL%>> vercel_deploy.txt
