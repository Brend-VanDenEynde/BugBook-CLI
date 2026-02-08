#!/usr/bin/env node
import figlet from 'figlet';

console.clear();

figlet('BUGBOOK', (err, data) => {
    if (err) {
        console.log('Something went wrong...');
        console.dir(err);
        return;
    }
    console.log(data);
    console.log('\nBugbook CLI Tool v1.0.0');
    console.log('-----------------------');
    console.log('Welcome to the Bugbook interface.\n');
});
