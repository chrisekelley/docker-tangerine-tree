# docker-tangerine-tree

Creates an instance ot Tangerine-tree

# Gettings started with Docker

Run the prebuilt image.
```
docker run -d --name tangerine-tree-container -p 80:80 tangerine/docker-tangerine-tree
```
Now add an entry to our `/etc/hosts` file to point to the IP address of your Docker so that it responds at the hostname of `local.tangerinecentral.org`.  Then go to `http://local.tangerinecentral.org/` in your browser.

Sandbox time! Run the prebuilt image but override it with your local code. Here's an example that works on R.J.'s laptop. The path to the code folder will be different for you. Just make sure you make that an absolute path, not relative like `./`. 
```
docker run -d --name tangerine-tree-container -p 80:80 --volume /Users/rsteinert/Github/Tangerine-Community/docker-tangerine-tree/:/root/Tangerine-tree tangerine/docker-tangerine-tree
```

Build the image yourself.
```
docker build -t tangerine/docker-tangerine-tree .
```

Push up your new image.
```
docker push tangerine/docker-tangerine-tree 
```

If you get an error when pushing to your own repository, login first
```
docker login
```
Run the container with environment variables that also has data volumes for couchdb and logs.
```
docker run -d -p 80:80  --name tangerine-tree-container -e "TS_URL=ping.tangerinecentral.org"  -e "T_NEW_ADMIN=freaky"  -e "T_NEW_ADMIN_PASS=password" -e "T_USER1=foo" -e "T_USER1_PASSWORD=bar" -v /var/lib/couchdb -v /var/log tangerine/docker-tangerine-tree
```
Get into a running container to play around.
```
docker exec -it tangerine-tree-container /bin/bash 
```

Is the container crashing on start so the above isn't working? Override the entrypoint command to start the container with just `/bin/bash`. 
```
docker run -it --entrypoint=/bin/bash tangerine/docker-tangerine-tree
```
Happy coding!
