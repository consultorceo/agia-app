import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, StatusBar, ActivityIndicator,
  KeyboardAvoidingView, Platform, Share, Clipboard, Alert,
} from 'react-native';
import { API_URL, USUARIO_ID, COLORES, FRENTES_COLORES } from '../constants';

const BurbujaMensaje = ({ item }) => {
  const esUsuario = item.tipo === 'user';
  const colorFrente = FRENTES_COLORES[item.frente] || COLORES.azulLight;

  const copiarTexto = () => {
    Clipboard.setString(item.texto);
    Alert.alert('Copiado', 'Puede pegarlo en WhatsApp ahora.');
  };

  return (
    <View style={[estilos.contenedorBurbuja, esUsuario && estilos.contenedorUsuario]}>
      <Text style={[estilos.etiqueta, esUsuario && estilos.etiquetaDerecha]}>
        {esUsuario ? 'Usted' : 'AGIA'}
      </Text>
      <TouchableOpacity
        onLongPress={!esUsuario ? copiarTexto : undefined}
        activeOpacity={0.8}
      >
        <View style={[
          estilos.burbuja,
          esUsuario ? estilos.burbujaUsuario : estilos.burbujaAGIA,
        ]}>
          <Text style={[
            estilos.textoBurbuja,
            esUsuario && estilos.textoUsuario,
          ]}>
            {item.texto}
          </Text>
          {!esUsuario && item.frente && item.frente !== 'general' && (
            <View style={[estilos.badge, { backgroundColor: colorFrente + '30' }]}>
              <Text style={[estilos.badgeTexto, { color: colorFrente }]}>
                {item.frente}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      {!esUsuario && item.requiereAprobacion && (
        <View style={estilos.aprobacionRow}>
          <Text style={estilos.aprobacionTexto}>¿Aprobás el borrador?</Text>
          <TouchableOpacity style={estilos.btnSi} onPress={() => item.onAprobar?.()}>
            <Text style={estilos.btnSiTexto}>Sí, enviar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={estilos.btnNo} onPress={() => item.onCancelar?.()}>
            <Text style={estilos.btnNoTexto}>No</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const IndicadorEscribiendo = () => (
  <View style={estilos.contenedorBurbuja}>
    <Text style={estilos.etiqueta}>AGIA</Text>
    <View style={[estilos.burbuja, estilos.burbujaAGIA, estilos.burbujaEscribiendo]}>
      <ActivityIndicator size="small" color={COLORES.azulLight} />
      <Text style={estilos.textoEscribiendo}>Procesando...</Text>
    </View>
  </View>
);

export default function ChatScreen({ route }) {
  const [mensajes, setMensajes] = useState([]);
  const [entrada, setEntrada] = useState('');
  const [cargando, setCargando] = useState(false);
  const listaRef = useRef(null);

  // Recibir mensaje compartido desde WhatsApp
  useEffect(() => {
    if (route?.params?.mensajeCompartido) {
      setEntrada(route.params.mensajeCompartido);
    }
  }, [route?.params?.mensajeCompartido]);

  // Mensaje de bienvenida
  useEffect(() => {
    setMensajes([{
      id: 'welcome',
      tipo: 'agia',
      texto: 'Buenos días, Carlos. Estoy listo para ayudarle. Puede escribirme, dictarme o reenviarme mensajes de WhatsApp.',
      frente: 'general',
    }]);
  }, []);

  const agregarMensaje = (msg) => {
    setMensajes(prev => [...prev, { id: Date.now().toString() + Math.random(), ...msg }]);
    setTimeout(() => listaRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const enviar = async () => {
    const texto = entrada.trim();
    if (!texto || cargando) return;

    setEntrada('');
    agregarMensaje({ tipo: 'user', texto });
    setCargando(true);

    try {
      const res = await fetch(`${API_URL}/mensaje`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId: USUARIO_ID, mensaje: texto }),
      });

      const data = await res.json();
      setCargando(false);

      if (data?.respuesta?.mensaje) {
        agregarMensaje({
          tipo: 'agia',
          texto: data.respuesta.mensaje,
          frente: data.respuesta.frente,
          requiereAprobacion: data.respuesta.requiereAprobacion,
          onAprobar: () => enviarDirecto('si'),
          onCancelar: () => enviarDirecto('no, cancelar'),
        });
      } else {
        agregarMensaje({ tipo: 'agia', texto: 'Hubo un problema. Intente nuevamente.', frente: 'general' });
      }
    } catch (e) {
      setCargando(false);
      agregarMensaje({ tipo: 'agia', texto: 'Error de conexión. Verifique su internet.', frente: 'general' });
    }
  };

  const enviarDirecto = async (texto) => {
    agregarMensaje({ tipo: 'user', texto });
    setCargando(true);
    try {
      const res = await fetch(`${API_URL}/mensaje`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId: USUARIO_ID, mensaje: texto }),
      });
      const data = await res.json();
      setCargando(false);
      if (data?.respuesta?.mensaje) {
        agregarMensaje({ tipo: 'agia', texto: data.respuesta.mensaje, frente: data.respuesta.frente });
      }
    } catch (e) {
      setCargando(false);
    }
  };

  const compartirConWhatsApp = async () => {
    const ultimo = [...mensajes].reverse().find(m => m.tipo === 'agia' && m.texto);
    if (!ultimo) return;
    await Share.share({ message: ultimo.texto });
  };

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle="light-content" backgroundColor={COLORES.fondoOscuro} />

      {/* Header */}
      <View style={estilos.header}>
        <View style={estilos.logo}>
          <Text style={estilos.logoTexto}>AG</Text>
        </View>
        <View style={estilos.headerInfo}>
          <Text style={estilos.headerTitulo}>AGIA</Text>
          <Text style={estilos.headerSub}>Asistente de Gerencia · FMC DataLab</Text>
        </View>
        <View style={estilos.dot} />
      </View>

      {/* Lista de mensajes */}
      <KeyboardAvoidingView
        style={estilos.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listaRef}
          data={mensajes}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <BurbujaMensaje item={item} />}
          contentContainerStyle={estilos.lista}
          onContentSizeChange={() => listaRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={cargando ? <IndicadorEscribiendo /> : null}
        />

        {/* Input */}
        <View style={estilos.inputArea}>
          <TextInput
            style={estilos.input}
            value={entrada}
            onChangeText={setEntrada}
            placeholder="Escriba su instrucción..."
            placeholderTextColor={COLORES.textoTerciario}
            multiline
            maxLength={1000}
            onSubmitEditing={enviar}
            returnKeyType="send"
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[estilos.btnEnviar, (!entrada.trim() || cargando) && estilos.btnEnviarDesactivado]}
            onPress={enviar}
            disabled={!entrada.trim() || cargando}
            activeOpacity={0.7}
          >
            <Text style={estilos.btnEnviarIcono}>▶</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORES.fondoOscuro,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORES.borde,
  },
  logo: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORES.azul,
    alignItems: 'center', justifyContent: 'center',
  },
  logoTexto: { color: '#fff', fontSize: 13, fontWeight: '600' },
  headerInfo: { flex: 1 },
  headerTitulo: { color: COLORES.texto, fontSize: 15, fontWeight: '600' },
  headerSub: { color: COLORES.textoSecundario, fontSize: 10, marginTop: 1 },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORES.verde,
  },

  lista: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },

  contenedorBurbuja: { alignItems: 'flex-start', marginBottom: 8 },
  contenedorUsuario: { alignItems: 'flex-end' },
  etiqueta: { fontSize: 10, color: COLORES.textoTerciario, marginBottom: 3 },
  etiquetaDerecha: { textAlign: 'right' },

  burbuja: {
    maxWidth: '84%', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 16,
  },
  burbujaAGIA: {
    backgroundColor: COLORES.fondoTarjeta,
    borderWidth: 1, borderColor: COLORES.borde,
    borderBottomLeftRadius: 3,
  },
  burbujaUsuario: {
    backgroundColor: COLORES.azul,
    borderBottomRightRadius: 3,
  },
  burbujaEscribiendo: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  textoBurbuja: { color: COLORES.texto, fontSize: 14, lineHeight: 21 },
  textoUsuario: { color: '#fff' },
  textoEscribiendo: { color: COLORES.textoSecundario, fontSize: 13 },

  badge: {
    alignSelf: 'flex-start', marginTop: 6,
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 20,
  },
  badgeTexto: { fontSize: 10, fontWeight: '500' },

  aprobacionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 6, flexWrap: 'wrap',
  },
  aprobacionTexto: { color: COLORES.textoSecundario, fontSize: 12 },
  btnSi: {
    backgroundColor: COLORES.verde + '30',
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
    borderColor: COLORES.verde,
  },
  btnSiTexto: { color: COLORES.verde, fontSize: 12, fontWeight: '500' },
  btnNo: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
    borderColor: COLORES.borde,
  },
  btnNoTexto: { color: COLORES.textoSecundario, fontSize: 12 },

  inputArea: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: COLORES.fondoTarjeta,
    borderTopWidth: 1, borderTopColor: COLORES.borde,
  },
  input: {
    flex: 1, backgroundColor: COLORES.fondoInput,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    color: COLORES.texto, fontSize: 14, lineHeight: 20,
    borderWidth: 1, borderColor: COLORES.bordeInput,
    maxHeight: 120,
  },
  btnEnviar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: COLORES.azul,
    alignItems: 'center', justifyContent: 'center',
  },
  btnEnviarDesactivado: { opacity: 0.4 },
  btnEnviarIcono: { color: '#fff', fontSize: 16 },
});
