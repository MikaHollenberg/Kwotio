import {
  Anchor,
  Beer,
  Cake,
  Camera,
  Clock,
  Coffee,
  Crown,
  CupSoda,
  Disc3,
  Flame,
  GlassWater,
  Gift,
  Heart,
  IceCreamCone,
  MapPin,
  Martini,
  Mic2,
  Music,
  PartyPopper,
  Pizza,
  Salad,
  Sandwich,
  Sailboat,
  Sparkles,
  Star,
  Sun,
  TreePalm,
  Trophy,
  Ticket,
  Umbrella,
  UtensilsCrossed,
  Users,
  Waves,
  Wine,
  type LucideIcon,
} from "lucide-react";

/** Gecureerde iconenset voor arrangement-onderdelen (categorieën, extra's-
 * vakken) -- bewust een beperkte, horeca/events-thema lijst i.p.v. de volle
 * Lucide-bibliotheek, zodat de kiezer overzichtelijk blijft en in stijl met
 * de rest van de app (dunne lijn-iconen). */
export const ARRANGEMENT_ICON_GROUPS: { label: string; icons: { key: string; label: string; Icon: LucideIcon }[] }[] = [
  {
    label: "Dranken",
    icons: [
      { key: "beer", label: "Bier", Icon: Beer },
      { key: "wine", label: "Wijn", Icon: Wine },
      { key: "martini", label: "Cocktail", Icon: Martini },
      { key: "glass-water", label: "Fris", Icon: GlassWater },
      { key: "coffee", label: "Koffie", Icon: Coffee },
      { key: "cup-soda", label: "Frisdrank", Icon: CupSoda },
    ],
  },
  {
    label: "Eten",
    icons: [
      { key: "utensils", label: "Diner", Icon: UtensilsCrossed },
      { key: "pizza", label: "Pizza", Icon: Pizza },
      { key: "ice-cream", label: "IJs", Icon: IceCreamCone },
      { key: "cake", label: "Taart", Icon: Cake },
      { key: "sandwich", label: "Lunch", Icon: Sandwich },
      { key: "salad", label: "Salade", Icon: Salad },
    ],
  },
  {
    label: "Muziek & feest",
    icons: [
      { key: "music", label: "Muziek", Icon: Music },
      { key: "mic", label: "DJ / microfoon", Icon: Mic2 },
      { key: "party", label: "Feest", Icon: PartyPopper },
      { key: "sparkles", label: "Extra's", Icon: Sparkles },
      { key: "disc", label: "Dansen", Icon: Disc3 },
      { key: "gift", label: "Cadeau", Icon: Gift },
    ],
  },
  {
    label: "Buiten & boot",
    icons: [
      { key: "sun", label: "Zon", Icon: Sun },
      { key: "waves", label: "Water", Icon: Waves },
      { key: "anchor", label: "Anker", Icon: Anchor },
      { key: "sailboat", label: "Boot", Icon: Sailboat },
      { key: "palm", label: "Strand", Icon: TreePalm },
      { key: "umbrella", label: "Parasol", Icon: Umbrella },
    ],
  },
  {
    label: "Overig",
    icons: [
      { key: "users", label: "Groep", Icon: Users },
      { key: "star", label: "Ster", Icon: Star },
      { key: "heart", label: "Favoriet", Icon: Heart },
      { key: "flame", label: "Populair", Icon: Flame },
      { key: "camera", label: "Foto", Icon: Camera },
      { key: "map-pin", label: "Locatie", Icon: MapPin },
      { key: "clock", label: "Tijd", Icon: Clock },
      { key: "trophy", label: "Trofee", Icon: Trophy },
      { key: "ticket", label: "Ticket", Icon: Ticket },
      { key: "crown", label: "Premium", Icon: Crown },
    ],
  },
];

/** Directe key->component-lookup i.p.v. een resolver-functie -- zo blijft
 * elke aanroepplek een platte object-index (`ARRANGEMENT_ICON_MAP[key]`),
 * wat de `react-hooks/static-components`-lintregel nodig heeft om een
 * dynamisch gekozen icoon-component veilig te achten (een functieaanroep
 * die een component teruggeeft telt voor die regel als "component tijdens
 * render aangemaakt", een platte lookup niet). */
export const ARRANGEMENT_ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  ARRANGEMENT_ICON_GROUPS.flatMap((group) => group.icons.map(({ key, Icon }) => [key, Icon])),
);
