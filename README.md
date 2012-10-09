dtraceit
========

DTrace is a great tool, and I'm not always that great, when you want to use `jstack`
with a nodejs app you need to make sure that dtrace translates symbols before
the traced process exits. If you're profiling a benchmark script or similar you
can use the `-p` option of DTrace to make sure it waits for the process to exit.

This script enforces that concept by using `child_process.fork` which inherently
doesn't exit unless the child actually calls `process.exit`

You can also use the `--timer` option and specify an amount of time to let DTrace
sample, or you can use `tick-60s { exit(0); }` in your DTrace script and when
DTrace exits it will kill the forked child.

It also has a `--profile` option which will automatically run the common DTrace
receipe for profiling a nodejs app: `profile-97/execname == "node" && arg1/{@[jstack(100, 8000)] = count(); } tick-60s { exit(0); }`

Otherwise you can pass your normal `-n` and `-s` options and they will be passed
as is to DTrace. All arguments passed after `--` will be passed as arguments to
the module to be traced.

In the future it will also have a `--stackvis` option that will produce the
flamegraph as well

Any unrecognized options (before `--`) are passed as is to DTrace

Example
-------

```text
./dtraceit --profile -- benchmark stock 1 100 > stacks.out
```
