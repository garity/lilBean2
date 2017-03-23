import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  Animated,
} from 'react-native';

export const ImagesView = (props) => {
  const images = props.images;
  return images && images.length > 0 ? 
    <View style={props.sceneContainerStyle} >
    {images.map((image, index) => {
      return (
        <View key={ image.filename } style={styles.container} >
          <Image style={styles.image}  source={{ uri: image.uri }} /> 
          <Animated.View style={{ 
            backgroundColor: image.color,
            opacity: image.opacity, 
            width: 375, 
            height: 667, 
            position: 'absolute' 
          }} />
        </View>
      )}
      )}
    </View>
    : null
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center',

  },
});