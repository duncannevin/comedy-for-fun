# Comedy For Fun

An experiment with Node.js actor systems using the [Comedy.js](https://github.com/untu/comedy) framework, pretty awesome!

### Prereqs

- [Node](https://nodejs.org/en/download/)

### Install Dependencies

```
  > npm install
```

### Start App

```
  > npm run dev
```

### REST

`/users/<Name>`

201
```
  // returns generated id
  > aduf98h2398jsaodf 
```

`/inc/[userId]`

200
```
  // returns a new number with every request
  > 1
```

### WebSockets

Be sure to register user with /users/[Name] before connecting to socket.

`/timer?userId=[userId]`

On connection the timer will stream a number every second. The `TimerActor` runs even after you
disconnect so when you reconnect the timer will still be running and will pick up wherever it is
at that time.

```
1
2
3
4
5
```
disconnect for `7` seconds
then reconnect
```
13
14
15
16
...
```