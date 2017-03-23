import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  CameraRoll,
  Animated,
  Dimensions,
  PanResponder
} from 'react-native';
import Sound from 'react-native-sound';
import {Swiper} from './app/Swiper';


// Sound error handler
const onSoundLoadError = (note) => (err) => {err && console.error(err, note)};

// piano sound files
const sounds = {
  'a':  new Sound('a.wav',  Sound.MAIN_BUNDLE, onSoundLoadError('a')),
  'a#':  new Sound('a#.wav',  Sound.MAIN_BUNDLE, onSoundLoadError('a#')),
  'b': new Sound('b.wav', Sound.MAIN_BUNDLE, onSoundLoadError('b')),
  'c':  new Sound('c.wav',  Sound.MAIN_BUNDLE, onSoundLoadError('c')),
  'c#': new Sound('c#.wav', Sound.MAIN_BUNDLE, onSoundLoadError('c#')),
  'd':  new Sound('d.wav',  Sound.MAIN_BUNDLE, onSoundLoadError('d')),
  'e':  new Sound('e.wav',  Sound.MAIN_BUNDLE, onSoundLoadError('e')),
  'f':  new Sound('f.wav',  Sound.MAIN_BUNDLE, onSoundLoadError('f')),
  'f#': new Sound('f#.wav', Sound.MAIN_BUNDLE, onSoundLoadError('f#')),
  'g':  new Sound('g.wav',  Sound.MAIN_BUNDLE, onSoundLoadError('g')),
  'g#': new Sound('g#.wav', Sound.MAIN_BUNDLE, onSoundLoadError('g#'))
}

let melody = ['c', 'd', 'e', 'g', 'a', 'b'];


export default class App extends Component {
  constructor() {
    super();
    this.state = {
      images: [],
      index: 0,
      scrollValue: new Animated.Value(0),
      bounceValue: new Animated.Value(0),
      viewWidth: Dimensions.get('window').width,
      threshold: 50,
      background: { 
        val: new Animated.Value(0),
        a: this.randomColor(),
        b: this.randomColor(),
      }
    };
    this.storeImages = this.storeImages.bind(this);
    this.handleLayout = this.handleLayout.bind(this);
    this.reorderImages = this.reorderImages.bind(this);
    this.goToPage = this.goToPage.bind(this);
  }

  componentWillMount() {
    let albumNames = ['lilBean', 'LilBean', 'lilbean', 'Lilbean'];

    function attemptGettingAlbumPhotos() {
      let fetchParams = {
        first: 20,
        groupTypes: "Album"
      };
      if (albumNames.length) {
        fetchParams.groupName = albumNames.shift();
      } else {
        fetchParams = { first: 20 };
      }
      return CameraRoll.getPhotos(fetchParams)
      .then(data => {
        if (data.edges.length) {
          return Promise.resolve(data);
        }
        if (!fetchParams.groupName) {
          return Promise.reject("No photos found!");
        }
        return attemptGettingAlbumPhotos();
      });
    }

    var photoGetter = attemptGettingAlbumPhotos()
    .then(data => {
      this.storeImages(data);
      this.reorderImages();
    }).catch(console.error);

    var photoGetter = CameraRoll.getPhotos({first: 20})
    .then(data => {
      this.storeImages(data);
      this.reorderImages();
    }).catch(console.error);

    const release = (e, gestureState) => {
      const relativeGestureDistance = gestureState.dx / this.state.viewWidth;
      const { vx } = gestureState;

      let newIndex = this.state.index;

      if (relativeGestureDistance < -0.5 || (relativeGestureDistance < 0 && vx <= -0.5)) {
        newIndex = newIndex + 1;
      } else if (relativeGestureDistance > 0.5 || (relativeGestureDistance > 0 && vx >= 0.5)) {
        newIndex = newIndex - 1;
      }
      this.goToPage(newIndex);
      
      Animated.spring(this.state.bounceValue, {toValue: 0})
      .start();
    };

    this._panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (e, gestureState) => {
        
        const { threshold } = this.state.threshold;
        // // and only if it exceeds the threshold
        if (threshold - Math.abs(gestureState.dx) > 0) {
          return false;
        }
        return true;
      },

      // Touch is released, scroll to the one that you're closest to
      onPanResponderRelease: release,
      onPanResponderTerminate: release,

      // Dragging, move the view with the touch
      onPanResponderMove: (e, gestureState) => {
        let dx = gestureState.dx;
        let offsetX = -dx / this.state.viewWidth + this.state.index;
        let dy = gestureState.dy;
        this.state.scrollValue.setValue(offsetX);
        this.state.bounceValue.setValue(dy);
      }
    });

    // animate background color
    animateBG = () => {
      this.state.background.a = this.state.background.b;
      this.state.background.b = this.randomColor();
      this.state.background.val.setValue(0);
      Animated.timing(this.state.background.val, { to: 1, duration: 5000 }).start(animateBG);
    }
  }

  // grabs images from data and assigns a color with opacity to each
  storeImages(data) {
    const assets = data.edges;
    const newImages = assets.map( asset => {
      var image = asset.node.image;
      image.color = this.randomColor();
      image.opacity = new Animated.Value(1);
      return image;
    });
    Animated.timing(newImages[0].opacity, {toValue: 0, delay: 500, duration: 2000 }).start();
    this.setState({
        images: newImages,
    });
  }

  // reorders state.images array to make infinite photo carousel
  reorderImages() {
    let images = this.state.images;
    let index = this.state.index;
    let newImages = images.slice();
    if (index === 0) {
      index = index + 1;
      newImages = images.slice(-1).concat(images.slice(0,-1));
    } else if (index === images.length-1) {
      index = index - 1;
      newImages = images.slice(1).concat(images[0]);
    }
    newImages.forEach((image, i) => {
      if (i !== index) {
        image.opacity.setValue(1);
        image.color = this.randomColor();
      }
    })
    this.setState({
      images: newImages,
      index: index,
      scrollValue: new Animated.Value(index)
    });
  }

  goToPage(pageNumber) {
    // sound notes play
    let note = melody.sort(() => Math.random() - 0.5 )[0];
    sounds[note].setCategory("Playback");
    sounds[note].stop();
    sounds[note].play();

    // doesn't scroll past the number of views
    pageNumber = Math.max(0, Math.min(pageNumber, this.state.images.length));
    this.setState({index: pageNumber})

    // animates scrolling to next image with color burst
    Animated.spring(this.state.scrollValue, {toValue: pageNumber})
    .start(() => {
      Animated.timing(this.state.images[pageNumber].opacity, {toValue: 0, duration: 1500 }).start();
      this.reorderImages()
    });
  }

  handleLayout(event) {
    const { width } = event.nativeEvent.layout;
    if (width) {
      this.setState({ viewWidth: width });
    }
  }

  randomRGB() {
    let r = Math.round(Math.random() * 255);
    let g = Math.round(Math.random() * 255);
    let b = Math.round(Math.random() * 255);
    return { r, g, b };
  }

  randomColor(rgb) {
    rgb = rgb || this.randomRGB();
    return 'rgb(' + [rgb.r, rgb.g, rgb.b].join(',') + ')';
  }


  render() {
    return (
      <View style={styles.container}>
        <Swiper 
        images={this.state.images} 
        handleLayout={this.handleLayout} 
        _panResponder={this._panResponder}
        scrollValue={this.state.scrollValue}
        bounceValue={this.state.bounceValue}
        viewWidth={this.state.viewWidth}
        background={this.state.background}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

});
