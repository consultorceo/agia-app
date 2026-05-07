import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import FrentesScreen from './src/screens/FrentesScreen';
import ChatScreen from './src/screens/ChatScreen';
import { COLORES } from './src/constants';

const Stack = createNativeStackNavigator();

const temaOscuro = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORES.fondo,
    card: COLORES.fondoOscuro,
    text: COLORES.texto,
    border: COLORES.borde,
  },
};

export default function App() {
  return (
    <NavigationContainer theme={temaOscuro}>
      <StatusBar style="light" backgroundColor={COLORES.fondoOscuro} />
      <Stack.Navigator
        initialRouteName="Frentes"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: COLORES.fondo },
        }}
      >
        <Stack.Screen name="Frentes" component={FrentesScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
