#!/usr/bin/env node

var opt = require('optimist')
  .usage('$0 [opts] [module] -- [module args]')
  .describe('-n', 'Specify probe name to trace (equivalent to dtrace -n)')
  .describe('-s', 'Specify a script to use for tracing (equivalent to dtrace -s)')
  .string(['-n', '-s'])
  .describe('--timer', 'Specify a maximum time for dtrace to run (in seconds)')
  .describe('--profile', 'Shortcut to do the normal dtrace profiling of a nodejs script')
  .boolean('profile')
  .describe('--silent', 'Should the child nodejs client be silent, default true')
  .boolean('silent')
  .default('silent', true)
  ;
var argv = opt.argv;

var cp = require('child_process');

var dtrace_args = [];
var needs_pid = true;

if (argv.profile) {
  dtrace_args = [
    '-n',
    'profile-97/execname == "node" && arg1/{@[jstack(100, 8000)] = count(); } tick-60s { exit(0); }',
  ];
}

if (argv.timer) {
  needs_pid = false;
}

Object.keys(argv).forEach(function (key) {
  if (['_', '$0',
       'profile',
       'timer',
       'silent',
       '-p'].indexOf(key) > -1)
    return;

  dtrace_args.push('-' + key);
  dtrace_args.push(argv[key]);
});

var params = argv._;

var script = cp.fork(params[0], params.slice(1), {silent: argv.silent})

script.on('message', function (msg) {
  script.send(msg);
});

if (needs_pid) {
  dtrace_args.push('-p');
  dtrace_args.push(script.pid);
}

var observer = cp.spawn('dtrace', dtrace_args, {stdio: 'inherit'})

observer.on('exit', function () {
  script.kill('SIGINT');
});

if (argv.timer) {
  setTimeout(function () {
    observer.kill('SIGINT')
  }, argv.timer * 1000);
}

process.on('SIGINT', function () {
  script.send({done: true});
  //observer.kill('SIGINT');
});
