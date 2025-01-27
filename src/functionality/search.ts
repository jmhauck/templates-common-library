import Search from "esri/widgets/Search";
import FeatureLayer from "esri/layers/FeatureLayer";
import MapView from "esri/views/MapView";
import SceneView from "esri/views/SceneView";
import Portal from "esri/portal/Portal";

interface SearchSourceConfigItem {
  maxResults: number;
  maxSuggestions: number;
  minSuggestCharacters: number;
  name: string;
  suggestionsEnabled: boolean;
  placeholder: string;
  withinViewEnabled: boolean;
  zoomScale: number;
  outFields?: string[];
}

interface LocatorSourceConfigItem extends SearchSourceConfigItem {
  url: string;
  singleLineFieldName: string;
  countryCode: string;
}

interface LayerSourceConfigItem extends SearchSourceConfigItem {
  displayField: string;
  exactMatch: boolean;
  layer: {
    url: string | FeatureLayer;
    id: string;
  };
  outFields: string[];
  searchFields: string;
  popupTemplate: any;
  popupEnabled: boolean;
}

interface SearchConfiguration {
  activeSourceIndex?: number;
  allPlaceholder?: string;
  includeDefaultSources?: boolean;
  searchAllEnabled?: boolean;
  sources?: Array<LocatorSourceConfigItem | LayerSourceConfigItem>;
}

export function createSearch(view: MapView | SceneView, portal: Portal, searchConfiguration: SearchConfiguration): Search {
  const INCLUDE_DEFAULT_SOURCES = "includeDefaultSources";
  const sources = searchConfiguration?.sources;

  if (sources?.length > 0) {
    searchConfiguration[INCLUDE_DEFAULT_SOURCES] = false;

    sources.forEach((source) => {
      const isLayerSource = source.hasOwnProperty("layer");
      if (isLayerSource) {
        const layerSource = source as LayerSourceConfigItem;
        const layerId = layerSource.layer?.id;
        const layerFromMap = layerId ? view.map.findLayerById(layerId) : null;
        const layerUrl = layerSource?.layer?.url;
        if (layerFromMap) {
          layerSource.layer = layerFromMap as FeatureLayer;
        } else if (layerUrl) {
          layerSource.layer = new FeatureLayer(layerUrl as any);
        }
      }
    });

    sources?.forEach((source) => {
      const isLocatorSource = source.hasOwnProperty("locator");
      if (isLocatorSource) {
        const locatorSource = (source as LocatorSourceConfigItem);
        if (locatorSource?.name === "ArcGIS World Geocoding Service") {
          const outFields = locatorSource.outFields || ["Addr_type", "Match_addr", "StAddr", "City"];
          locatorSource.outFields = outFields;
          locatorSource.singleLineFieldName = "SingleLine";
        }

        locatorSource.url = locatorSource.url;
        delete locatorSource.url;
      }
    });
  } else {
    searchConfiguration = {
      ...searchConfiguration,
      includeDefaultSources: true
    }
  }

  return new Search({
    view,
    portal,
    ...searchConfiguration
  });
}
