import React from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../constants';
import { useLang } from '../hooks/useLang';

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const Row = ({ label, children }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{children}</Text>
  </View>
);

export default function PrivacyPolicyModal({ visible, onClose }) {
  const { t } = useLang();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('privacyLink')}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.updated}>Última actualización: 20 jul 2026</Text>

          <Section title="Resumen">
            <Text style={styles.p}>
              FlowCash usa tus datos únicamente para hacer funcionar la app: guardar tus movimientos, mostrarte
              tus gráficos, y — si activás Premium — procesar el pago. No vendemos tus datos ni los usamos para
              nada fuera de eso.
            </Text>
          </Section>

          <Section title="Datos que recogemos">
            <Row label="Email">Crear tu cuenta e iniciar sesión (contraseña o Google)</Row>
            <Row label="Transacciones">Montos, categorías, descripciones y fechas de tus movimientos</Row>
            <Row label="Presupuestos, ahorros, recordatorios">Datos opcionales que vos cargás</Row>
            <Row label="Estado de suscripción">Para habilitar las funciones Premium (vía RevenueCat)</Row>
            <Row label="ID de publicidad del dispositivo">Solo si sos usuario gratuito, para mostrarte anuncios (AppLovin, Meta, Unity Ads)</Row>
            <Row label="Emails de Mercado Pago (opcional)">Solo si activás la importación por Gmail — leemos únicamente los mails de Mercado Pago</Row>
            <Text style={[styles.p, { marginTop: 8 }]}>
              No accedemos a tu ubicación, contactos, cámara, ni fotos.
            </Text>
          </Section>

          <Section title="Con quién compartimos">
            <Text style={styles.p}>
              Firebase (Google) guarda tu cuenta y tus movimientos. RevenueCat gestiona tu suscripción.
              AppLovin, Meta Audience Network y Unity Ads muestran anuncios a usuarios del plan gratuito.
              La API de Gmail solo se usa si conectás la importación de Mercado Pago, con tu autorización.
            </Text>
          </Section>

          <Section title="Seguridad">
            <Text style={styles.p}>
              Toda la comunicación entre la app y nuestros servidores viaja cifrada (HTTPS/TLS). Las reglas de
              acceso a la base de datos solo permiten que cada usuario vea y modifique sus propios datos.
            </Text>
          </Section>

          <Section title="Eliminar tu cuenta">
            <Text style={styles.p}>
              Es autoservicio, sin necesidad de escribirle a nadie: arriba de la pantalla principal, al lado de
              tu email, tocá <Text style={styles.bold}>&ldquo;{t('deleteAccount')}&rdquo;</Text> y confirmá. Se borra al
              instante tu cuenta, transacciones, categorías, presupuestos, metas de ahorro y recordatorios.
              Las copias de respaldo internas, si las hay, se purgan dentro de los 90 días siguientes.
            </Text>
            <Text style={styles.p}>
              También podés borrar transacciones o recordatorios sueltos, o desconectar Gmail, sin eliminar
              toda la cuenta.
            </Text>
          </Section>

          <Section title="Menores de edad">
            <Text style={styles.p}>
              FlowCash no está dirigida a menores de 13 años y no recogemos intencionalmente datos de menores
              de esa edad.
            </Text>
          </Section>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    borderBottomWidth: 1, borderColor: COLORS.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  closeBtn: { padding: 6 },
  closeBtnText: { fontSize: 18, color: COLORS.muted },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  updated: { fontSize: 11, color: COLORS.muted, marginBottom: 20 },
  section: {
    backgroundColor: COLORS.card, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border,
    padding: 16, marginBottom: 14,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.accent, marginBottom: 10 },
  p: { fontSize: 13, color: COLORS.text, lineHeight: 20 },
  bold: { fontWeight: '700', color: COLORS.text },
  row: { marginBottom: 10 },
  rowLabel: { fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  rowValue: { fontSize: 12.5, color: COLORS.muted, lineHeight: 18 },
});
