REGISTRY=asifmahmoud414
VERSION=latest

.PHONY: all build tag push

all: build tag push

build:
	docker build -t api-gateway:$(VERSION) ./api-gateway
	docker build -t auth-service:$(VERSION) ./auth-service
	docker build -t inventory-service:$(VERSION) ./inventory-service

tag:
	docker tag api-gateway:$(VERSION) $(REGISTRY)/api-gateway:$(VERSION)
	docker tag auth-service:$(VERSION) $(REGISTRY)/auth-service:$(VERSION)
	docker tag inventory-service:$(VERSION) $(REGISTRY)/inventory-service:$(VERSION)

push:
	docker push $(REGISTRY)/api-gateway:$(VERSION)
	docker push $(REGISTRY)/auth-service:$(VERSION)
	docker push $(REGISTRY)/inventory-service:$(VERSION)

clean:
	docker rmi api-gateway:$(VERSION) $(REGISTRY)/api-gateway:$(VERSION)
	docker rmi auth-service:$(VERSION) $(REGISTRY)/auth-service:$(VERSION)
	docker rmi inventory-service:$(VERSION) $(REGISTRY)/inventory-service:$(VERSION)