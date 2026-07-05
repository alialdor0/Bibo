// Safe stand-in for React Native's experimental VirtualView native component.
// The original file uses newer Flow "match" syntax that Metro cannot parse yet
// (a known upstream bug). This feature is experimental and not used by this
// app, so a plain View is a safe drop-in replacement.
import { View } from 'react-native';

export default View;
