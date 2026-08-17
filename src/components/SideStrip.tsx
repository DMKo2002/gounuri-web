// Franja lateral decorativa reutilizable — reconstruida con colores sólidos
// exactos (nunca se deforman, a diferencia del asset compuesto "Barra
// lateral derecha.svg") en vez de estirar/recortar la imagen. El bloque
// superior es siempre #454B53; el inferior cambia de color por pantalla. El
// isotipo "G" queda centrado en su tamaño nativo, bajado a la posición real
// que tiene dentro del asset (~9% del borde inferior del bloque).
//
// Extraído de onboarding/page.tsx a un componente propio (2026-08-17) para
// poder reusarlo también en /registro (mismo patrón visual de Figma:
// "Registracion 1"/"5"/"6" comparten esta franja, solo cambia el color del
// bloque inferior).
export const G_ICON_PATH =
  'M90.752 1018.28L85.4541 1020.99C87.1055 1022.43 88.4021 1022.84 90.0283 1024.96C91.4512 1026.81 92.3987 1029.01 92.7627 1031.15C94.2271 1039.76 88.7192 1046.46 81.6738 1048.59C82.8602 1049.33 83.5949 1050.27 83.7139 1051.35C83.879 1052.85 82.8299 1054.37 80.9609 1055.68C82.1514 1056.12 83.2042 1056.98 83.876 1058.17C85.3404 1060.77 84.4422 1063.99 81.8701 1065.38C79.2977 1066.76 76.0252 1065.77 74.5606 1063.17C73.714 1061.67 73.6575 1059.96 74.2568 1058.51C73.2314 1058.76 72.1519 1058.96 71.0332 1059.1C63.6613 1060.04 57.3865 1058.07 57.0176 1054.72C56.6639 1051.5 61.8803 1048.17 68.8193 1047.09C60.7076 1042.33 59.9898 1033.16 63.4981 1027.19C65.9785 1022.97 68.8297 1021.61 73.7607 1019.05C78.1817 1016.76 82.9364 1014.06 87.4238 1012L90.752 1018.28ZM83.5244 1029.17C81.0462 1026.37 76.0541 1025.29 72.2647 1028.31L72.2637 1028.31C63.7815 1035.09 74.3451 1046.72 82.5098 1040C85.2929 1037.7 86.7021 1032.75 83.5244 1029.17Z'

export default function SideStrip({ color }: { color: string }) {
  return (
    <div className="hidden xl:flex xl:w-[8.9%] xl:flex-col">
      <div className="flex-1" style={{ background: '#454B53' }} />
      <div className="relative flex-1" style={{ background: color }}>
        <svg
          width="28"
          height="40"
          viewBox="55 1010 41 59"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="absolute bottom-[9%] left-1/2 -translate-x-1/2"
        >
          <path d={G_ICON_PATH} fill="white" />
        </svg>
      </div>
    </div>
  )
}
