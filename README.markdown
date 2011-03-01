# THIS IS AN EXPERIMENT - Not tested, ugly code

This is my first attempt at writing Node.js code. Untested, crappy code.

It proved to work and I'm working on a real project which should get live in March 2011.  

# Nodeci

Continuous Integration server based on Node.js.

## Description

Nodeci is a [Continuous Integration](http://en.wikipedia.org/wiki/Continuous_integration
"Continuous Integration definition on Wikipedia") server. It features
a web interface with distributed realtime results.

Builds are
simple shell commands. Their exit code determines the build result ("0"
means success, anything else is a failure).

## Installation

[Node.js](http://nodejs.org/ "Node.js official website") is required.

    $ git clone <nodeci-repos>
    $ git submodule init
    $ git submodule update
    
## Configuration

All you need to configure is the build command you want to run and the
arguments for it. Nodeci listens on 0.0.0.0:8126 by default.

Configuration is stored in `config/nodeci_config.js`:

    var options = {
        hostname: "0.0.0.0",
        port: 8126,
        name: "Project",
        build: {
            command: '/bin/bash',
            args:    ['-l', './bash_cukes']
        }     
    };
    module.exports = options;
    
## License

This software is subject to the MIT license.

Copyright © 2010 Julien Biezemans.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
