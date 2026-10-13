@echo off
title HR Management - MySQL 3308 Starter
echo ====================================================
echo Starting MySQL Database on Port 3308...
echo Database Path: C:\xampp_new\mysql
echo ====================================================

cd /D "C:\xampp_new\mysql"
bin\mysqld.exe --defaults-file="bin\my.ini" --standalone
pause
