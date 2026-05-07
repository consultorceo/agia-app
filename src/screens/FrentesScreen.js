import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import { API_URL, USUARIO_ID, COLORES, FRENTES_COLORES } from '../constants';

const TarjetaFrente = ({ frente, onPress }) => {
  const color = FRENTES_COLORES[frente.nombre] || COLORES.azul;
  const urgentes = frente.pendientes?.urgentes || 0;
  const total = frente.pendientes?.total || 0;

  const estado = urgentes > 0 ? 'urgente' : total > 0 ? 'pendiente' : 'al_dia';
  const estadoTexto = urgentes > 0 ? 'Urgente' : total > 0 ? 'Pendiente' : 'Al día';
  const estadoColor = urgentes > 0 ? '#E24B4A' : total > 0 ? '#BA7517' : '#1D9E75';

  return (
    <TouchableOpacity style={estilos.tarjeta} onPress={onPress} activeOpacity={0.7}>
      <View style={[estilos.tarjetaAccento, { backgroundColor: color }]} />
      <View style={estilos.tarjetaContenido}>
        <View style={estilos.tarjetaTop}>
          <Text style={estilos.tarjetaNombre}>{frente.nombre}</Text>
          <View style={[estilos.estadoBadge, { backgroundColor: estadoColor + '20', borderColor: estadoColor }]}>
            <Text style={[estilos.estadoTexto, { color: estadoColor }]}>{estadoTexto}</Text>
          </View>
        </View>
        <Text style={estilos.tarjetaDesc} numberOfLines={1}>{frente.descripcion}</Text>
        {total > 0 && (
          <Text style={estilos.tarjetaPendientes}>
            {urgentes > 0 ? `${urgentes} urgente${urgentes > 1 ? 's' : ''}` : `${total} pendiente${total > 1 ? 's' : ''}`}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function FrentesScreen({ navigation }) {
  const [frentes, setFrente] = useState([]);
  const [resumen, setResumen] = useState('');
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const cargar = async (esRefresh = false) => {
    if (esRefresh) setRefrescando(true);
    try {
      const [resFrentes, resResumen] = await Promise.all([
        fetch(`${API_URL}/frentes?usuarioId=${USUARIO_ID}`),
        fetch(`${API_URL}/resumen-diario?usuarioId=${USUARIO_ID}`),
      ]);
      const dataFrentes = await resFrentes.json();
      const dataResumen = await resResumen.json();

      if (dataFrentes.frentes) setFrente(dataFrentes.frentes);
      if (dataResumen.resumen) setResumen(dataResumen.resumen);
    } catch (e) {
      console.error('Error cargando datos:', e);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const ahora = new Date();
  const saludo = ahora.getHours() < 12 ? 'Buenos días' : ahora.getHours() < 18 ? 'Buenas tardes' : 'Buenas noches';

  if (cargando) {
    return (
      <SafeAreaView style={[estilos.contenedor, estilos.centrado]}>
        <ActivityIndicator size="large" color={COLORES.azulLight} />
        <Text style={estilos.cargandoTexto}>Cargando AGIA...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle="light-content" backgroundColor={COLORES.fondoOscuro} />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => cargar(true)} tintColor={COLORES.azulLight} />}
      >
        {/* Header */}
        <View style={estilos.header}>
          <View style={estilos.headerTop}>
            <View style={estilos.logo}>
              <Text style={estilos.logoTexto}>AG</Text>
            </View>
            <View style={estilos.dot} />
          </View>
          <Text style={estilos.saludo}>{saludo}</Text>
          <Text style={estilos.nombre}>Carlos</Text>

          {resumen ? (
            <View style={estilos.resumenBox}>
              <Text style={estilos.resumenTexto}>{resumen}</Text>
            </View>
          ) : null}
        </View>

        {/* Frentes */}
        <View style={estilos.cuerpo}>
          <Text style={estilos.seccionTitulo}>Sus frentes</Text>
          {frentes.map((f, i) => (
            <TarjetaFrente
              key={f.id || i}
              frente={f}
              onPress={() => navigation.navigate('Chat')}
            />
          ))}
        </View>
      </ScrollView>

      {/* FAB — ir al chat */}
      <TouchableOpacity
        style={estilos.fab}
        onPress={() => navigation.navigate('Chat')}
        activeOpacity={0.8}
      >
        <Text style={estilos.fabIcono}>💬</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  centrado: { alignItems: 'center', justifyContent: 'center', gap: 16 },
  cargandoTexto: { color: COLORES.textoSecundario, fontSize: 14 },

  header: {
    backgroundColor: COLORES.fondoOscuro,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24,
    borderBottomWidth: 1, borderBottomColor: COLORES.borde,
  },
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  logo: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORES.azul,
    alignItems: 'center', justifyContent: 'center',
  },
  logoTexto: { color: '#fff', fontSize: 13, fontWeight: '600' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORES.verde },

  saludo: { color: COLORES.textoSecundario, fontSize: 13 },
  nombre: { color: COLORES.texto, fontSize: 24, fontWeight: '600', marginTop: 2 },

  resumenBox: {
    marginTop: 14, backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: COLORES.borde,
  },
  resumenTexto: { color: COLORES.textoSecundario, fontSize: 13, lineHeight: 20 },

  cuerpo: { padding: 16 },
  seccionTitulo: {
    fontSize: 11, fontWeight: '600', color: COLORES.textoTerciario,
    letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12,
  },

  tarjeta: {
    backgroundColor: COLORES.fondoTarjeta, borderRadius: 14,
    marginBottom: 10, flexDirection: 'row', overflow: 'hidden',
    borderWidth: 1, borderColor: COLORES.borde,
  },
  tarjetaAccento: { width: 4 },
  tarjetaContenido: { flex: 1, padding: 14 },
  tarjetaTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  tarjetaNombre: { color: COLORES.texto, fontSize: 14, fontWeight: '500', flex: 1 },
  tarjetaDesc: { color: COLORES.textoSecundario, fontSize: 12, marginBottom: 4 },
  tarjetaPendientes: { color: '#BA7517', fontSize: 11, fontWeight: '500' },

  estadoBadge: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 20, borderWidth: 1,
  },
  estadoTexto: { fontSize: 10, fontWeight: '500' },

  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORES.azul,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
  fabIcono: { fontSize: 24 },
});
