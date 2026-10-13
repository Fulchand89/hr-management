Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\xampp_new\mysql"
WshShell.Run "bin\mysqld.exe --defaults-file=bin\my.ini --standalone", 0, False
